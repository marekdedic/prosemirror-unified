import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { UnistText } from "./TextExtension";

import { MarkExtension } from "../../src/MarkExtension";

export interface UnistCode extends UnistNode {
  type: "code";
  value: string;
}

export const codeSpec: MarkSpec = {
  toDOM: (): DOMOutputSpec => ["code"],
};

export class CodeExtension extends MarkExtension<UnistCode> {
  public override processConvertedUnistNodes([
    convertedNode,
  ]: Array<UnistText>): UnistCode {
    return { type: this.unistNodeName(), value: convertedNode.value };
  }

  public override proseMirrorMarkName(): string {
    return "code";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return codeSpec;
  }

  public override unistNodeIsLeaf(): boolean {
    return true;
  }

  public override unistNodeName(): "code" {
    return "code";
  }

  public override unistNodeToProseMirrorNodes(
    node: UnistCode,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [
      proseMirrorSchema.text(node.value, [
        proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
      ]),
    ];
  }
}
