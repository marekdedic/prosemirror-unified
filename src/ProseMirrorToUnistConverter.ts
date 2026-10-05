import type { Mark, Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";
import type { MarkExtension } from "./MarkExtension";

/**
 * A ProseMirror node converted to unist nodes, together with the marks that
 * still need to be applied to them.
 */
interface ConvertedNode {
  nodes: Array<UnistNode>;
  pendingMarks: Array<ResolvedMark>;
}

interface ResolvedMark {
  extension: MarkExtension<UnistNode>;
  mark: Mark;
}

export class ProseMirrorToUnistConverter {
  private readonly extensionManager: ExtensionManager;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  public convert(node: ProseMirrorNode): UnistNode {
    const rootNode = this.convertNode(node);
    if (rootNode.length !== 1) {
      throw new Error(
        "Couldn't find any way to convert the root ProseMirror node.",
      );
    }
    return rootNode[0];
  }

  /**
   * Converts a node, applying its leaf mark (if any) right away, so that it
   * ends up innermost, and leaving the rest of its marks pending.
   */
  private convertChild(node: ProseMirrorNode): ConvertedNode {
    const leafMarks: Array<ResolvedMark> = [];
    const pendingMarks: Array<ResolvedMark> = [];
    for (const mark of node.marks) {
      const resolvedMark = this.resolveMark(mark);
      if (resolvedMark === null) {
        continue;
      }
      if (resolvedMark.extension.unistNodeIsLeaf()) {
        leafMarks.push(resolvedMark);
      } else {
        pendingMarks.push(resolvedMark);
      }
    }
    for (const { mark } of leafMarks.slice(1)) {
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Couldn't convert ProseMirror mark of type "${mark.type.name}" to a unist node, as the ProseMirror node of type "${node.type.name}" already has the leaf mark "${leafMarks[0].mark.type.name}".`,
      );
    }
    let nodes = this.convertNode(node);
    if (leafMarks.length > 0) {
      nodes = nodes.map((convertedNode) =>
        leafMarks[0].extension.processConvertedUnistNodes(
          [convertedNode],
          leafMarks[0].mark,
        ),
      );
    }
    return { nodes, pendingMarks };
  }

  /**
   * Converts a node and its children, without applying the node's own marks.
   */
  private convertNode(node: ProseMirrorNode): Array<UnistNode> {
    const extension = pickExtension(
      this.extensionManager.nodeExtensions(),
      (nodeExtension) => nodeExtension.proseMirrorToUnistTest(node),
      "node",
      node,
    );
    if (extension === null) {
      return [];
    }
    const convertedChildren = node.children.map((child) =>
      this.convertChild(child),
    );
    return extension.proseMirrorNodeToUnistNodes(
      node,
      applyMarks(convertedChildren),
    );
  }

  private resolveMark(mark: Mark): ResolvedMark | null {
    const extension = pickExtension(
      this.extensionManager.markExtensions(),
      (markExtension) => markExtension.proseMirrorMarkName() === mark.type.name,
      "mark",
      mark,
    );
    return extension === null ? null : { extension, mark };
  }
}

/**
 * Wraps the converted nodes in their pending marks. Neighbouring nodes sharing
 * an equal mark are wrapped together; where marks overlap, the one covering the
 * most neighbouring nodes goes outermost.
 */
function applyMarks(convertedNodes: Array<ConvertedNode>): Array<UnistNode> {
  const result: Array<UnistNode> = [];
  let start = 0;
  while (start < convertedNodes.length) {
    const { nodes, pendingMarks } = convertedNodes[start];
    if (pendingMarks.length === 0) {
      result.push(...nodes);
      ++start;
      continue;
    }
    const { end, extension, mark } = longestMarkRun(convertedNodes, start);
    const run = convertedNodes
      .slice(start, end)
      .map((convertedNode) => withoutMark(convertedNode, mark));
    result.push(extension.processConvertedUnistNodes(applyMarks(run), mark));
    start = end;
  }
  return result;
}

/**
 * Finds which of the pending marks of the node at `start` covers the longest
 * run of neighbouring nodes, with ties going to the mark of the lowest rank.
 */
function longestMarkRun(
  convertedNodes: Array<ConvertedNode>,
  start: number,
): ResolvedMark & { end: number } {
  return convertedNodes[start].pendingMarks
    .map((pending) => ({
      ...pending,
      end: markRunEnd(convertedNodes, start, pending.mark),
    }))
    .reduce((longest, run) => (run.end > longest.end ? run : longest));
}

/**
 * Returns the index one past the end of the run of neighbouring nodes,
 * starting at `start`, that all carry `mark`.
 */
function markRunEnd(
  convertedNodes: Array<ConvertedNode>,
  start: number,
  mark: Mark,
): number {
  let end = start;
  while (
    end < convertedNodes.length &&
    convertedNodes[end].pendingMarks.some((pending) => pending.mark.eq(mark))
  ) {
    ++end;
  }
  return end;
}

/**
 * Picks the first of the extensions that can convert a ProseMirror node or
 * mark, warning if there are none or more than one.
 */
function pickExtension<Extension extends object>(
  extensions: Array<Extension>,
  canConvert: (extension: Extension) => boolean,
  kind: "mark" | "node",
  target: Mark | ProseMirrorNode,
): Extension | null {
  const matches = extensions.filter(canConvert);
  const subject = `ProseMirror ${kind} of type "${target.type.name}"`;
  if (matches.length === 0) {
    // eslint-disable-next-line no-console -- Intended console warning
    console.warn(
      `Couldn't find any way to convert ${subject} to a unist node.`,
    );
    return null;
  }
  if (matches.length > 1) {
    const names = matches
      .map((extension) => extension.constructor.name)
      .join(", ");
    // eslint-disable-next-line no-console -- Intended console warning
    console.warn(
      `Multiple extensions (${names}) can convert the ${subject} to a unist node, using ${matches[0].constructor.name}.`,
    );
  }
  return matches[0];
}

function withoutMark(convertedNode: ConvertedNode, mark: Mark): ConvertedNode {
  return {
    nodes: convertedNode.nodes,
    pendingMarks: convertedNode.pendingMarks.filter(
      (pending) => !pending.mark.eq(mark),
    ),
  };
}
