import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";
import type { UnistParagraph } from "./ParagraphExtension";

export interface UnistRoot extends UnistNode {
  type: "root";
  children: Array<UnistParagraph>;
}

export const rootSpec: NodeSpec = {
  content: "paragraph+",
};

export class RootExtension extends NodeExtension<UnistRoot> {
  public unistNodeName(): "root" {
    return "root";
  }
  public proseMirrorNodeName(): "doc" {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return rootSpec;
  }

  public unistNodeToProseMirrorNodes(
    _: UnistRoot,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistRoot> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<UnistParagraph>,
      },
    ];
  }
}
