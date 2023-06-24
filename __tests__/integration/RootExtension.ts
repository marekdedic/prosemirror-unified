import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";
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
  ): Array<UnistRoot> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<UnistParagraph>,
      },
    ];
  }
}
