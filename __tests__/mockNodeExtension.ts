import type { Mocked } from "jest-mock";
import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { NodeExtension } from "../src/NodeExtension";
import { mockExtension } from "./mockExtension";

export function mockNodeExtension<UNode extends UnistNode>(): Mocked<
  NodeExtension<UNode>
> {
  return {
    ...mockExtension(),
    proseMirrorToUnistTest: jest.fn<boolean, [ProseMirrorNode]>(),
    proseMirrorNodeName: jest.fn<string | null, []>(),
    proseMirrorNodeSpec: jest.fn<NodeSpec | null, []>(),
    proseMirrorNodeToUnistNodes: jest.fn<
      Array<UNode>,
      [ProseMirrorNode, Array<UnistNode>]
    >(),
  } as unknown as Mocked<NodeExtension<UNode>>;
}
