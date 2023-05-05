import type { BlockContent, Blockquote, DefinitionContent } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "../../prosemirror-unified";

export class BlockquoteExtension extends NodeExtension<Blockquote> {
  public unistNodeName(): "blockquote" {
    return "blockquote";
  }

  public proseMirrorNodeName(): string {
    return "blockquote";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM(): DOMOutputSpec {
        return ["blockquote", 0];
      },
    };
  }

  public unistNodeToProseMirrorNodes(
    _node: Blockquote,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(schema, convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _node: ProseMirrorNode,
    convertedChildren: Array<BlockContent | DefinitionContent>
  ): Array<Blockquote> {
    return [
      {
        type: this.unistNodeName(),
        children: convertedChildren,
      },
    ];
  }
}