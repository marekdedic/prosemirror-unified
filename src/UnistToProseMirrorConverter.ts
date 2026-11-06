import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Parent, Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";

interface ConversionResult {
  nodes: Array<ProseMirrorNode>;
  // Whether `nodes` contain source text of an unconvertible unist node that
  // hasn't been placed in a non-inline node yet.
  unplacedFallback: boolean;
}

export class UnistToProseMirrorConverter {
  private readonly extensionManager: ExtensionManager;
  private readonly proseMirrorSchema: Schema<string, string>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.extensionManager = extensionManager;
    this.proseMirrorSchema = proseMirrorSchema;
  }

  private static sourceText(
    node: UnistNode,
    source: string,
  ): string | undefined {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      return undefined;
    }
    return source.slice(start, end);
  }

  private static unistNodeIsParent(node: UnistNode): node is Parent {
    return "children" in node;
  }

  /**
   * Converts a unist tree to a ProseMirror document. Unist nodes no extension
   * can convert are dropped with a warning.
   */
  public convert(unist: UnistNode): ProseMirrorNode {
    const root = this.convertTree(unist, undefined);
    if (root === null) {
      throw new Error("Couldn't find any way to convert the root unist node.");
    }
    return root;
  }

  /**
   * Like `convert`, but unist nodes no extension can convert are kept as text,
   * sliced from `source` by the node's position. Nodes without a position are
   * dropped with a warning. Returns null if the root can't be converted, if
   * the text spans multiple lines, or if the text can't be placed in the
   * document, for example because it would sit directly in a node that only
   * accepts block content. Also returns null if the resulting document isn't
   * valid for the schema.
   */
  public convertKeepingSource(
    unist: UnistNode,
    source: string,
  ): ProseMirrorNode | null {
    const doc = this.convertTree(unist, source);
    // Extensions that create their nodes without checking the content can
    // otherwise leave the text somewhere it isn't allowed.
    try {
      doc?.check();
    } catch {
      return null;
    }
    return doc;
  }

  // Returns null if the source text of an unconvertible node can't be kept.
  private convertNode(
    node: UnistNode,
    context: Partial<Record<string, never>>,
    source: string | undefined,
  ): ConversionResult | null {
    const matches = this.extensionManager
      .syntaxExtensions()
      .filter((extension) => extension.unistToProseMirrorTest(node));
    if (matches.length === 0) {
      const text =
        source === undefined
          ? undefined
          : UnistToProseMirrorConverter.sourceText(node, source);
      if (text !== undefined) {
        // Text spanning lines would contain the line prefixes of any container
        // it is in, so it can't be kept faithfully.
        if (text.includes("\n")) {
          return null;
        }
        return text === ""
          ? { nodes: [], unplacedFallback: false }
          : {
              nodes: [this.proseMirrorSchema.text(text)],
              unplacedFallback: true,
            };
      }
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Couldn't find any way to convert unist node of type "${node.type}" to a ProseMirror node.`,
      );
      return { nodes: [], unplacedFallback: false };
    }
    if (matches.length > 1) {
      const names = matches
        .map((extension) => extension.constructor.name)
        .join(", ");
      // eslint-disable-next-line no-console -- Intended console warning
      console.warn(
        `Multiple extensions (${names}) can convert the unist node of type "${node.type}" to a ProseMirror node, using ${matches[0].constructor.name}.`,
      );
    }
    const convertedChildren: Array<ProseMirrorNode> = [];
    let childrenHaveFallback = false;
    if (UnistToProseMirrorConverter.unistNodeIsParent(node)) {
      for (const child of node.children) {
        const converted = this.convertNode(child, context, source);
        if (converted === null) {
          return null;
        }
        convertedChildren.push(...converted.nodes);
        childrenHaveFallback ||= converted.unplacedFallback;
      }
    }
    const nodes = matches[0].unistNodeToProseMirrorNodes(
      node,
      this.proseMirrorSchema,
      convertedChildren,
      context,
    );
    if (!childrenHaveFallback) {
      return { nodes, unplacedFallback: false };
    }
    // No nodes means the fallback text couldn't be placed, e.g. because
    // createAndFill rejected it. Inline nodes (such as text with a mark
    // applied) pass it on to their parent. Otherwise, the extension accepted
    // its children, or chose not to use them.
    if (nodes.length === 0) {
      return null;
    }
    return { nodes, unplacedFallback: nodes.every((child) => child.isInline) };
  }

  private convertTree(
    unist: UnistNode,
    source: string | undefined,
  ): ProseMirrorNode | null {
    const context: Partial<Record<string, never>> = {};
    const result = this.convertNode(unist, context, source);
    // Run the hooks even if the conversion gave up, so that extensions can
    // clean up after the nodes they have already converted.
    for (const extension of this.extensionManager.syntaxExtensions()) {
      extension.postUnistToProseMirrorHook(context);
    }
    if (result?.nodes.length !== 1 || result.unplacedFallback) {
      return null;
    }
    return result.nodes[0];
  }
}
