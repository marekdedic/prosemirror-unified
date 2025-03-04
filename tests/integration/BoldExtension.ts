import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { toggleMark } from "prosemirror-commands";

import type { UnistText } from "./TextExtension";

import { MarkInputRule } from "../../src";
import { MarkExtension } from "../../src/MarkExtension";

export interface UnistBold extends UnistNode {
  children: Array<UnistText>;
  type: "bold";
}

export const boldSpec: MarkSpec = {
  toDOM: (): DOMOutputSpec => ["bold"],
};

export class BoldExtension extends MarkExtension<UnistBold> {
  public override processConvertedUnistNode(
    convertedNode: UnistText,
  ): UnistBold {
    return { children: [convertedNode], type: this.unistNodeName() };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /<b>([^\s](?:.*[^\s])?)<\/b>(.)$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Mod-b": toggleMark(proseMirrorSchema.marks[this.proseMirrorMarkName()]),
    };
  }

  public override proseMirrorMarkName(): string {
    return "bold";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return boldSpec;
  }

  public override unistNodeName(): "bold" {
    return "bold";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistBold,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark([
        proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
      ]),
    );
  }
}
