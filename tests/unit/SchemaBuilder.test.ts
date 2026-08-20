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

test("SchemaBuilder warns about conflicting specs from different extensions", () => {
  expect.assertions(3);

  const NodeExtension1 = class<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {};
  const NodeExtension2 = class<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {};
  const docExtension = vi.mocked(new NodeExtension1());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const otherDocExtension = vi.mocked(new NodeExtension2());
  otherDocExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  otherDocExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([
    docExtension,
    otherDocExtension,
    textExtension,
  ]);

  const builder = new SchemaBuilder(manager);

  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('ProseMirror node spec for "doc"');
  expect(builder.build()).toBeInstanceOf(Schema);
});

test("SchemaBuilder doesn't warn when only one extension provides a mark spec", () => {
  expect.assertions(2);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = vi.mocked(new MockMarkExtension());
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce({});
  const markExtension2 = vi.mocked(new MockMarkExtension());
  markExtension2.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  markExtension2.proseMirrorMarkSpec.mockReturnValueOnce(null);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValueOnce([markExtension1, markExtension2]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);

  const builder = new SchemaBuilder(manager);

  expect(warn).not.toHaveBeenCalled();
  expect(builder.build()).toBeInstanceOf(Schema);
});
