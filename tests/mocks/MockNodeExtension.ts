import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { vi } from "vitest";

import { NodeExtension } from "../../src/NodeExtension";

export class MockNodeExtension<
  HandledUnistNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends NodeExtension<HandledUnistNode, UnistToProseMirrorContext> {
  public proseMirrorNodeName = vi.fn<() => string | null>();

  public proseMirrorNodeSpec = vi.fn<() => NodeSpec | null>();

  public proseMirrorNodeToUnistNodes =
    vi.fn<
      (
        node: ProseMirrorNode,
        convertedChildren: Array<UnistNode>,
      ) => Array<HandledUnistNode>
    >();

  public override proseMirrorNodeView =
    vi.fn<() => NodeViewConstructor | null>();

  public unistNodeName = vi.fn<() => HandledUnistNode["type"]>();

  public unistNodeToProseMirrorNodes =
    vi.fn<
      (
        node: HandledUnistNode,
        schema: Schema<string, string>,
        convertedChildern: Array<ProseMirrorNode>,
        context: Partial<UnistToProseMirrorContext>,
      ) => Array<ProseMirrorNode>
    >();
}
