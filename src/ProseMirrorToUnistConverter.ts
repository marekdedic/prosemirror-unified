import type { Mark, Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";
import type { MarkExtension } from "./MarkExtension";

interface ConvertedNode {
  marks: Array<ExtensionMark>;
  nodes: Array<UnistNode>;
}

interface ExtensionMark {
  extension: MarkExtension<UnistNode>;
  mark: Mark;
}

/**
 * Returns the index one past the last node of the run of neighbouring nodes
 * starting at `start` that all carry `mark`.
 */
const markRunEnd = (
  convertedNodes: Array<ConvertedNode>,
  start: number,
  mark: Mark,
): number => {
  let end = start;
  while (
    end < convertedNodes.length &&
    convertedNodes[end].marks.some((other) => other.mark.eq(mark))
  ) {
    ++end;
  }
  return end;
};

export class ProseMirrorToUnistConverter {
  private readonly extensionManager: ExtensionManager;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  public convert(node: ProseMirrorNode): UnistNode {
    const rootNode = this.applyMarks([this.convertMarkedNode(node)]);
    if (rootNode.length !== 1) {
      throw new Error(
        "Couldn't find any way to convert the root ProseMirror node.",
      );
    }
    return rootNode[0];
  }

  /**
   * Wraps the converted nodes in their non-leaf marks. Neighbouring nodes
   * sharing an equal mark are grouped under a single unist node; where marks
   * overlap, the one covering the most neighbouring nodes goes outermost, with
   * ties going to the mark of the lowest rank.
   */
  private applyMarks(convertedNodes: Array<ConvertedNode>): Array<UnistNode> {
    const result: Array<UnistNode> = [];
    let i = 0;
    while (i < convertedNodes.length) {
      const { marks, nodes } = convertedNodes[i];
      if (marks.length === 0) {
        result.push(...nodes);
        ++i;
        continue;
      }
      let outermost = marks[0];
      let runEnd = markRunEnd(convertedNodes, i, outermost.mark);
      for (const mark of marks.slice(1)) {
        const end = markRunEnd(convertedNodes, i, mark.mark);
        if (end > runEnd) {
          outermost = mark;
          runEnd = end;
        }
      }
      const innerNodes = convertedNodes
        .slice(i, runEnd)
        .map((convertedNode) => ({
          marks: convertedNode.marks.filter(
            ({ mark }) => !mark.eq(outermost.mark),
          ),
          nodes: convertedNode.nodes,
        }));
      result.push(
        outermost.extension.processConvertedUnistNodes(
          this.applyMarks(innerNodes),
          outermost.mark,
        ),
      );
      i = runEnd;
    }
    return result;
  }

  private convertMarkedNode(node: ProseMirrorNode): ConvertedNode {
    const marks: Array<ExtensionMark> = [];
    let leafMark: ExtensionMark | null = null;
    for (const mark of node.marks) {
      const extension = this.findMarkExtension(mark);
      if (extension === null) {
        continue;
      }
      if (!extension.unistNodeIsLeaf()) {
        marks.push({ extension, mark });
      } else if (leafMark === null) {
        leafMark = { extension, mark };
      } else {
        // eslint-disable-next-line no-console -- Intended console warning
        console.warn(
          `Couldn't convert ProseMirror mark of type "${mark.type.name}" to a unist node, as the ProseMirror node of type "${node.type.name}" already has the leaf mark "${leafMark.mark.type.name}".`,
        );
      }
    }
    let nodes = this.convertNode(node);
    if (leafMark !== null) {
      const { extension, mark } = leafMark;
      nodes = nodes.map((convertedNode) =>
        extension.processConvertedUnistNodes([convertedNode], mark),
      );
    }
    return { marks, nodes };
  }

  private convertNode(node: ProseMirrorNode): Array<UnistNode> {
    const matches = this.extensionManager
      .nodeExtensions()
      .filter((extension) => extension.proseMirrorToUnistTest(node));
    if (matches.length === 0) {
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Couldn't find any way to convert ProseMirror node of type "${node.type.name}" to a unist node.`,
      );
      return [];
    }
    if (matches.length > 1) {
      const names = matches
        .map((extension) => extension.constructor.name)
        .join(", ");
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Multiple extensions (${names}) can convert the ProseMirror node of type "${node.type.name}" to a unist node, using ${matches[0].constructor.name}.`,
      );
    }
    const convertedChildren: Array<ConvertedNode> = [];
    for (let i = 0; i < node.childCount; ++i) {
      convertedChildren.push(this.convertMarkedNode(node.child(i)));
    }
    return matches[0].proseMirrorNodeToUnistNodes(
      node,
      this.applyMarks(convertedChildren),
    );
  }

  private findMarkExtension(mark: Mark): MarkExtension<UnistNode> | null {
    const matches = this.extensionManager
      .markExtensions()
      .filter(
        (extension) => mark.type.name === extension.proseMirrorMarkName(),
      );
    if (matches.length === 0) {
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Couldn't find any way to convert ProseMirror mark of type "${mark.type.name}" to a unist node.`,
      );
      return null;
    }
    if (matches.length > 1) {
      const names = matches
        .map((extension) => extension.constructor.name)
        .join(", ");
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Multiple extensions (${names}) can convert the ProseMirror mark of type "${mark.type.name}" to a unist node, using ${matches[0].constructor.name}.`,
      );
    }
    return matches[0];
  }
}
