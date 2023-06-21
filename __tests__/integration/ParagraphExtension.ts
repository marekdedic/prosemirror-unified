import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";
import type { UnistText } from "./TextExtension";

export interface UnistParagraph extends UnistNode {
  type: "paragraph";
  children: Array<UnistText>;
}

export const paragraphSpec: NodeSpec = {
  content: "inline*",
  toDOM(): DOMOutputSpec {
    return ["p", 0];
  },
};

export class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public proseMirrorNodeName(): string {
    return "paragraph";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return paragraphSpec;
  }

  public unistNodeToProseMirrorNodes(
    _: UnistParagraph,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistParagraph> {
    return [
      { type: "paragraph", children: convertedChildren as Array<UnistText> },
    ];
  }
}
