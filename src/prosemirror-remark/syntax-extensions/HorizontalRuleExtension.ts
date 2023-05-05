import type { ThematicBreak } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class HorizontalRuleExtension extends NodeExtension<ThematicBreak> {
  public unistNodeName(): "thematicBreak" {
    return "thematicBreak";
  }

  public proseMirrorNodeName(): string {
    return "horizontal_rule";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM(): DOMOutputSpec {
        return ["div", ["hr"]];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: ThematicBreak,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(): Array<ThematicBreak> {
    return [
      {
        type: this.unistNodeName(),
      },
    ];
  }
}