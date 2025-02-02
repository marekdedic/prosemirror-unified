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
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends NodeExtension<UNode, UnistToProseMirrorContext> {
  public proseMirrorNodeName = vi.fn<() => string | null>();

  public proseMirrorNodeSpec = vi.fn<() => NodeSpec | null>();

  public proseMirrorNodeToUnistNodes =
    vi.fn<
      (
        node: ProseMirrorNode,
        convertedChildren: Array<UnistNode>,
      ) => Array<UNode>
    >();

  public override proseMirrorNodeView =
    vi.fn<() => NodeViewConstructor | null>();

  public unistNodeName = vi.fn<() => UNode["type"]>();

  public unistNodeToProseMirrorNodes =
    vi.fn<
      (
        node: UNode,
        schema: Schema<string, string>,
        convertedChildern: Array<ProseMirrorNode>,
        context: Partial<UnistToProseMirrorContext>,
      ) => Array<ProseMirrorNode>
    >();
}
