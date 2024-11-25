import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Parent, Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";

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

  private static unistNodeIsParent(node: UnistNode): node is Parent {
    return "children" in node;
  }

  public convert(unist: UnistNode): ProseMirrorNode {
    const context: Partial<unknown> = {};
    const rootNode = this.convertNode(unist, context);
    for (const extension of this.extensionManager.syntaxExtensions()) {
      extension.postUnistToProseMirrorHook(context);
    }
    if (rootNode.length !== 1) {
      throw new Error("Couldn't find any way to convert the root unist node.");
    }
    return rootNode[0];
  }

  private convertNode(
    node: UnistNode,
    context: Partial<unknown>,
  ): Array<ProseMirrorNode> {
    for (const extension of this.extensionManager.syntaxExtensions()) {
      if (!extension.unistToProseMirrorTest(node)) {
        continue;
      }
      let convertedChildren: Array<ProseMirrorNode> = [];
      if (UnistToProseMirrorConverter.unistNodeIsParent(node)) {
        convertedChildren = ([] as Array<ProseMirrorNode>).concat.apply(
          [],
          node.children.map((child) => this.convertNode(child, context)),
        );
      }
      return extension.unistNodeToProseMirrorNodes(
        node,
        this.proseMirrorSchema,
        convertedChildren,
        context,
      );
    }
    // eslint-disable-next-line no-console -- Intended console warning
    console.warn(
      `Couldn't find any way to convert unist node of type "${node.type}" to a ProseMirror node.`,
    );
    return [];
  }
}
