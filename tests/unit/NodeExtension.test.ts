import type { Node as UnistNode } from "unist";

import {
  type NodeSpec,
  type Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { expect, test } from "vitest";

import { NodeExtension } from "../../src/NodeExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

test("NodeExtension.proseMirrorToUnistTest has a default implementation", () => {
  const extension = new MockNodeExtension();
  extension.proseMirrorNodeName.mockReturnValue("node1");
  const schema = new Schema({
    marks: {},
    nodes: {
      doc: {},
      node1: {},
      node2: {},
      text: {},
    },
  });
  const node1 = schema.nodes.node1.create();
  const node2 = schema.nodes.node2.create();

  expect(extension.proseMirrorToUnistTest(node1)).toBe(true);
  expect(extension.proseMirrorToUnistTest(node2)).toBe(false);
});

test("NodeExtension.proseMirrorNodeView has a default implementation", () => {
  expect.assertions(1);

  // MockNodeExtension replaces this method with a mock, so a real subclass is
  // needed to reach the default implementation.
  class ConcreteNodeExtension extends NodeExtension<UnistNode> {
    public override proseMirrorNodeName(): string {
      return "node1";
    }

    public override proseMirrorNodeSpec(): NodeSpec {
      return {};
    }

    public override proseMirrorNodeToUnistNodes(): Array<UnistNode> {
      return [];
    }

    public override unistNodeName(): string {
      return "node1";
    }

    public override unistNodeToProseMirrorNodes(): Array<ProseMirrorNode> {
      return [];
    }
  }

  const extension = new ConcreteNodeExtension();

  expect(extension.proseMirrorNodeView()).toBeNull();
});
