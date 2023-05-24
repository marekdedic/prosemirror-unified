import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../src/NodeExtension";

export class MockNodeExtension<
  UNode extends UnistNode,
  Context = Record<string, never>
> extends NodeExtension<UNode, Context> {
  public proseMirrorNodeName = jest.fn<string | null, []>();

  public proseMirrorNodeSpec = jest.fn<NodeSpec | null, []>();

  public proseMirrorNodeToUnistNodes = jest.fn<
    Array<UNode>,
    [ProseMirrorNode, Array<UnistNode>]
  >();

  // TODO: This is from SyntaxExtension
  public unistNodeName = jest.fn<UNode["type"], []>();

  // TODO: This is from SyntaxExtension
  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [UNode, Array<ProseMirrorNode>, Partial<Context>]
  >();
}
