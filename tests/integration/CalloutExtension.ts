import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";
import { NodeExtension } from "../../src/NodeExtension";

export interface UnistCallout extends UnistNode {
  type: "callout";
}

// The spec renders a span. A rendered aside therefore proves that the node
// view was used instead of the spec.
export const calloutSpec: NodeSpec = {
  group: "inline",
  inline: true,
  toDOM: (): DOMOutputSpec => ["span"],
};

export const calloutNodeView: NodeViewConstructor = () => {
  const dom = document.createElement("aside");
  dom.className = "callout";
  return { dom };
};

export class CalloutExtension extends NodeExtension<UnistCallout> {
  public override proseMirrorNodeName(): string {
    return "callout";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return calloutSpec;
  }

  public override proseMirrorNodeToUnistNodes(): Array<UnistCallout> {
    return [{ type: "callout" }];
  }

  public override proseMirrorNodeView(): NodeViewConstructor {
    return calloutNodeView;
  }

  public override unistNodeName(): "callout" {
    return "callout";
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistCallout,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      [],
    );
  }
}
