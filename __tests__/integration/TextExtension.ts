import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";

export interface UnistText extends UnistNode {
  type: "text";
  value: string;
}

export const textSpec: NodeSpec = {
  group: "inline",
};

export class TextExtension extends NodeExtension<UnistText> {
  public unistNodeName(): "text" {
    return "text";
  }

  public proseMirrorNodeName(): string {
    return "text";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return textSpec;
  }

  public unistNodeToProseMirrorNodes(
    node: UnistText,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<UnistText> {
    return [{ type: "text", value: node.text ?? "" }];
  }
}
