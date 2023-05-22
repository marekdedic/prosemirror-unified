import { MarkType, NodeType, Schema } from "prosemirror-model";

import { SchemaBuilder } from "../src/SchemaBuilder";
import { mockExtensionManager } from "./mockExtensionManager";
import { mockMarkExtension } from "./mockMarkExtension";
import { mockNodeExtension } from "./mockNodeExtension";

test("SchemaBuilder works with nodes", () => {
  const docExtension = mockNodeExtension();
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = mockNodeExtension();
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = mockExtensionManager();
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);

  const builder = new SchemaBuilder(manager);
  const schema = builder.build();

  expect(schema).toBeInstanceOf(Schema);
  expect(schema.nodes["doc"]).toBeInstanceOf(NodeType);
  expect(schema.nodes["text"]).toBeInstanceOf(NodeType);
  expect(schema.spec.nodes.get("doc")).toStrictEqual({});
  expect(schema.spec.nodes.get("text")).toStrictEqual({});
});

test("SchemaBuilder works with marks", () => {
  const docExtension = mockNodeExtension();
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = mockNodeExtension();
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = mockMarkExtension();
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce({});

  const manager = mockExtensionManager();
  manager.markExtensions.mockReturnValueOnce([markExtension1]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);

  const builder = new SchemaBuilder(manager);
  const schema = builder.build();

  expect(schema).toBeInstanceOf(Schema);
  expect(schema.marks["MARK_1"]).toBeInstanceOf(MarkType);
  expect(schema.nodes["doc"]).toBeInstanceOf(NodeType);
  expect(schema.nodes["text"]).toBeInstanceOf(NodeType);
  expect(schema.spec.marks.get("MARK_1")).toStrictEqual({});
  expect(schema.spec.nodes.get("doc")).toStrictEqual({});
  expect(schema.spec.nodes.get("text")).toStrictEqual({});
});
