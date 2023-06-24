import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";
import { NodeExtension } from "../../src/NodeExtension";
import type { UnistBold } from "./BoldExtension";
import type { UnistLink } from "./LinkExtension";
import type { UnistText } from "./TextExtension";

export interface UnistParagraph extends UnistNode {
  type: "paragraph";
  children: Array<UnistBold | UnistLink | UnistText>;
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
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren
    );
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
