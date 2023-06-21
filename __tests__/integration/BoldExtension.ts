import type {
  DOMOutputSpec,
  MarkSpec,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

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
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark([
        this.proseMirrorSchema().marks[this.proseMirrorMarkName()].create(),
      ])
    );
  }

  public processConvertedUnistNode(convertedNode: UnistText): UnistBold {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
