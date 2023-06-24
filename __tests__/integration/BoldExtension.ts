import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { MarkInputRule } from "../../src";
import { MarkExtension } from "../../src/MarkExtension";
import type { UnistText } from "./TextExtension";

export interface UnistBold extends UnistNode {
  type: "bold";
  children: Array<UnistText>;
}

export const boldSpec: MarkSpec = {
  toDOM(): DOMOutputSpec {
    return ["bold"];
  },
};

export class BoldExtension extends MarkExtension<UnistBold> {
  public unistNodeName(): "bold" {
    return "bold";
  }

  public proseMirrorMarkName(): string {
    return "bold";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return boldSpec;
  }

  public unistNodeToProseMirrorNodes(
    _: UnistBold,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark([proseMirrorSchema.marks[this.proseMirrorMarkName()].create()])
    );
  }

  public processConvertedUnistNode(convertedNode: UnistText): UnistBold {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }

  public proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /<b>([^\s](?:.*[^\s])?)<\/b>(.)$/,
        proseMirrorSchema.marks[this.proseMirrorMarkName()]
      ),
    ];
  }
}
