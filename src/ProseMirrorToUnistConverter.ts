import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ExtensionManager } from "./ExtensionManager";

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
    let convertedChildren: Array<UnistNode> = [];
    for (let i = 0; i < node.childCount; ++i) {
      convertedChildren = convertedChildren.concat(
        this.convertNode(node.child(i)),
      );
    }
    const convertedNodes = matches[0].proseMirrorNodeToUnistNodes(
      node,
      convertedChildren,
    );
    return convertedNodes.map((convertedNode) => {
      let postProcessedNode = convertedNode;
      for (const mark of node.marks) {
        let processed = false;
        for (const extension of this.extensionManager.markExtensions()) {
          if (mark.type.name === extension.proseMirrorMarkName()) {
            postProcessedNode = extension.processConvertedUnistNode(
              postProcessedNode,
              mark,
            );
            processed = true;
          }
        }
        if (!processed) {
          // eslint-disable-next-line no-console -- Intended console warning
          console.warn(
            `Couldn't find any way to convert ProseMirror mark of type "${mark.type.name}" to a unist node.`,
          );
        }
      }
      return postProcessedNode;
    });
  }
}
