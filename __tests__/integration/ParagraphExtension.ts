import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { UnistBold } from "./BoldExtension";
import type { UnistLink } from "./LinkExtension";
import type { UnistText } from "./TextExtension";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";
import { NodeExtension } from "../../src/NodeExtension";

export interface UnistParagraph extends UnistNode {
  children: Array<UnistBold | UnistLink | UnistText>;
  type: "paragraph";
}

export const paragraphSpec: NodeSpec = {
  content: "inline*",
  toDOM: (): DOMOutputSpec => ["p", 0],
};

export class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public override proseMirrorNodeName(): string {
    return "paragraph";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return paragraphSpec;
  }

  public override proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistParagraph> {
    return [
      { children: convertedChildren as Array<UnistText>, type: "paragraph" },
    ];
  }

  public override unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistParagraph,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }
}
