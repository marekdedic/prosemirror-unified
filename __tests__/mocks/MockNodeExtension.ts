import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";

export class MockNodeExtension<
  UNode extends UnistNode,
  Context extends Record<string, unknown> = Record<string, never>
> extends NodeExtension<UNode, Context> {
  public proseMirrorNodeName = jest.fn<string | null, []>();

  public proseMirrorNodeSpec = jest.fn<NodeSpec | null, []>();

  public proseMirrorNodeToUnistNodes = jest.fn<
    Array<UNode>,
    [ProseMirrorNode, Array<UnistNode>]
  >();

  public unistNodeName = jest.fn<UNode["type"], []>();

  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [UNode, Schema<string, string>, Array<ProseMirrorNode>, Partial<Context>]
  >();
}
