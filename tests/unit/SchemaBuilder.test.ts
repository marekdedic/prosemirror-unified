import type { Node as UnistNode } from "unist";

import {
  type DOMOutputSpec,
  type Mark,
  MarkType,
  NodeType,
  Schema,
} from "prosemirror-model";
import { expect, test, vi } from "vitest";

import { ExtensionManager } from "../../src/ExtensionManager";
import { SchemaBuilder } from "../../src/SchemaBuilder";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

vi.mock("../../src/ExtensionManager");

test("SchemaBuilder works with nodes", () => {
  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = vi.mocked(new ExtensionManager([]));
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
  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = vi.mocked(new MockMarkExtension());
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce({});

  const manager = vi.mocked(new ExtensionManager([]));
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

test("SchemaBuilder works with complex specs", () => {
  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const docSpec = {
    code: true,
    content: "text*",
    defining: true,
    group: "block",
    marks: "",
    parseDOM: [{ tag: "pre" }],
    toDOM: (): DOMOutputSpec => ["pre", ["code", 0]],
  };
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce(docSpec);
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = vi.mocked(new MockMarkExtension());
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  const markSpec = {
    attrs: { href: { default: null } },
    inclusive: false,
    parseDOM: [
      {
        getAttrs: (
          dom: Node | string,
        ): {
          href: string | null;
        } => ({
          href: (dom as HTMLElement).getAttribute("href"),
        }),
        tag: "a[href]",
      },
    ],
    toDOM: (node: Mark): DOMOutputSpec => ["a", node.attrs],
  };
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce(markSpec);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([markExtension1]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);

  const builder = new SchemaBuilder(manager);
  const schema = builder.build();

  expect(schema).toBeInstanceOf(Schema);
  expect(schema.marks["MARK_1"]).toBeInstanceOf(MarkType);
  expect(schema.nodes["doc"]).toBeInstanceOf(NodeType);
  expect(schema.nodes["text"]).toBeInstanceOf(NodeType);
  expect(schema.spec.marks.get("MARK_1")).toStrictEqual(markSpec);
  expect(schema.spec.nodes.get("doc")).toStrictEqual(docSpec);
  expect(schema.spec.nodes.get("text")).toStrictEqual({});
});

test("SchemaBuilder skips node extensions with no name or no spec", () => {
  expect.assertions(3);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const namelessExtension = vi.mocked(new MockNodeExtension());
  namelessExtension.proseMirrorNodeName.mockReturnValueOnce(null);
  namelessExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const speclessExtension = vi.mocked(new MockNodeExtension());
  speclessExtension.proseMirrorNodeName.mockReturnValueOnce("SPECLESS");
  speclessExtension.proseMirrorNodeSpec.mockReturnValueOnce(null);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([
    docExtension,
    textExtension,
    namelessExtension,
    speclessExtension,
  ]);

  const builder = new SchemaBuilder(manager);
  const schema = builder.build();

  expect(schema.spec.nodes.size).toBe(2);
  expect(schema.spec.nodes.get("doc")).toStrictEqual({});
  expect(schema.spec.nodes.get("text")).toStrictEqual({});
});

test("SchemaBuilder skips mark extensions with no name or no spec", () => {
  expect.assertions(3);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = vi.mocked(new MockMarkExtension());
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce({});
  const namelessExtension = vi.mocked(new MockMarkExtension());
  namelessExtension.proseMirrorMarkName.mockReturnValueOnce(null);
  namelessExtension.proseMirrorMarkSpec.mockReturnValueOnce({});
  const speclessExtension = vi.mocked(new MockMarkExtension());
  speclessExtension.proseMirrorMarkName.mockReturnValueOnce("SPECLESS");
  speclessExtension.proseMirrorMarkSpec.mockReturnValueOnce(null);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([
    markExtension1,
    namelessExtension,
    speclessExtension,
  ]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);

  const builder = new SchemaBuilder(manager);
  const schema = builder.build();

  expect(schema.spec.marks.size).toBe(1);
  expect(schema.spec.marks.get("MARK_1")).toStrictEqual({});
  expect(schema.marks["MARK_1"]).toBeInstanceOf(MarkType);
});

test("SchemaBuilder throws on a duplicate node name", () => {
  expect.assertions(1);

  class NodeExtension1<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class NodeExtension2<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}

  const extension1 = vi.mocked(new NodeExtension1());
  extension1.proseMirrorNodeName.mockReturnValueOnce("doc");
  extension1.proseMirrorNodeSpec.mockReturnValueOnce({});
  const extension2 = vi.mocked(new NodeExtension2());
  extension2.proseMirrorNodeName.mockReturnValueOnce("doc");
  extension2.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([extension1, extension2]);

  expect(() => new SchemaBuilder(manager)).toThrow(
    'Two extensions (NodeExtension1 and NodeExtension2) both provide the ProseMirror node "doc".',
  );
});

test("SchemaBuilder throws on a duplicate mark name", () => {
  expect.assertions(1);

  class MarkExtension1<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class MarkExtension2<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const extension1 = vi.mocked(new MarkExtension1());
  extension1.proseMirrorMarkName.mockReturnValueOnce("MARK");
  extension1.proseMirrorMarkSpec.mockReturnValueOnce({});
  const extension2 = vi.mocked(new MarkExtension2());
  extension2.proseMirrorMarkName.mockReturnValueOnce("MARK");
  extension2.proseMirrorMarkSpec.mockReturnValueOnce({});

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([extension1, extension2]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension]);

  expect(() => new SchemaBuilder(manager)).toThrow(
    'Two extensions (MarkExtension1 and MarkExtension2) both provide the ProseMirror mark "MARK".',
  );
});

test("SchemaBuilder reports two different extensions sharing a name", () => {
  expect.assertions(1);

  // Two distinct classes can share a name, in which case naming them twice
  // would be more confusing than helpful.
  const NodeExtension1 = class n<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {};
  const NodeExtension2 = class n<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {};

  const extension1 = vi.mocked(new NodeExtension1());
  extension1.proseMirrorNodeName.mockReturnValueOnce("doc");
  extension1.proseMirrorNodeSpec.mockReturnValueOnce({});
  const extension2 = vi.mocked(new NodeExtension2());
  extension2.proseMirrorNodeName.mockReturnValueOnce("doc");
  extension2.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([extension1, extension2]);

  expect(() => new SchemaBuilder(manager)).toThrow(
    'Two different extensions named "n" both provide the ProseMirror node "doc".',
  );
});
