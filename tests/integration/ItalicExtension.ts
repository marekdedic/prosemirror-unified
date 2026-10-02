import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { UnistBold } from "./BoldExtension";
import type { UnistText } from "./TextExtension";

import { MarkExtension } from "../../src/MarkExtension";

export interface UnistItalic extends UnistNode {
  children: Array<UnistBold | UnistText>;
  type: "italic";
}

export const italicSpec: MarkSpec = {
  toDOM: (): DOMOutputSpec => ["italic"],
};

export class ItalicExtension extends MarkExtension<UnistItalic> {
  public override processConvertedUnistNode(
    convertedNode: UnistBold | UnistText,
  ): UnistItalic {
    return { children: [convertedNode], type: this.unistNodeName() };
  }

  public override proseMirrorMarkName(): string {
    return "italic";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return italicSpec;
  }

  public override unistNodeName(): "italic" {
    return "italic";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistItalic,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        proseMirrorSchema.marks[this.proseMirrorMarkName()]
          .create()
          .addToSet(child.marks),
      ),
    );
  }
}
