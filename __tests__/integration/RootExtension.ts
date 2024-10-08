import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { UnistParagraph } from "./ParagraphExtension";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";
import { NodeExtension } from "../../src/NodeExtension";

export interface UnistRoot extends UnistNode {
  children: Array<UnistParagraph>;
  type: "root";
}

export const rootSpec: NodeSpec = {
  content: "paragraph+",
};

export class RootExtension extends NodeExtension<UnistRoot> {
  public override proseMirrorNodeName(): "doc" {
    return "doc";
  }
  public override proseMirrorNodeSpec(): NodeSpec {
    return rootSpec;
  }

  public override proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistRoot> {
    return [
      {
        children: convertedChildren as Array<UnistParagraph>,
        type: "root",
      },
    ];
  }

  public override unistNodeName(): "root" {
    return "root";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistRoot,
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
