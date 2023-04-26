import type { Text } from "mdast";
import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { ProseMirrorRemarkNodeExtension } from "../ProseMirrorRemarkNodeExtension";

export class TextExtension extends ProseMirrorRemarkNodeExtension {
  public mdastNodeName(): "text" {
    return "text";
  }

  public proseMirrorNodeName(): string {
    return "text";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "inline",
    };
  }

  public mdastNodeToProseMirrorNodes(
    node: Text,
    _: Array<ProseMirrorNode>,
    schema: Schema
  ): Array<ProseMirrorNode> {
    return [schema.text(node.value)];
  }

  public proseMirrorNodeToMdastNodes(node: ProseMirrorNode): Array<Text> {
    return [{ type: this.mdastNodeName(), value: node.text ?? "" }];
  }
}