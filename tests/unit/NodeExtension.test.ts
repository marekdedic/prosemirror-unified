import { Schema } from "prosemirror-model";
import { expect, test } from "vitest";

import { Extension } from "../../src/Extension";
import { NodeExtension } from "../../src/NodeExtension";
import { SyntaxExtension } from "../../src/SyntaxExtension";
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

  expect(extension).toBeInstanceOf(NodeExtension);
  expect(extension).toBeInstanceOf(SyntaxExtension);
  expect(extension).toBeInstanceOf(Extension);

  expect(extension.proseMirrorToUnistTest(node1)).toBe(true);
  expect(extension.proseMirrorToUnistTest(node2)).toBe(false);
});
