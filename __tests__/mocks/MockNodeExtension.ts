import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";

export class MockNodeExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends NodeExtension<UNode, UnistToProseMirrorContext> {
  public proseMirrorNodeName = jest.fn<string | null, []>();

  public proseMirrorNodeSpec = jest.fn<NodeSpec | null, []>();

  public proseMirrorNodeToUnistNodes = jest.fn<
    Array<UNode>,
    [ProseMirrorNode, Array<UnistNode>]
  >();

  public override proseMirrorNodeView = jest.fn<NodeViewConstructor | null, []>();

  public unistNodeName = jest.fn<UNode["type"], []>();

  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [
      UNode,
      Schema<string, string>,
      Array<ProseMirrorNode>,
      Partial<UnistToProseMirrorContext>,
    ]
  >();
}
