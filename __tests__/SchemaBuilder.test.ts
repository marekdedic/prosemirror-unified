import {
  type DOMOutputSpec,
  type Mark,
  MarkType,
  NodeType,
  Schema,
} from "prosemirror-model";

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

test("SchemaBuilder works with complex specs", () => {
  const docExtension = mockNodeExtension();
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const docSpec = {
    content: "text*",
    group: "block",
    code: true,
    defining: true,
    marks: "",
    parseDOM: [{ tag: "pre" }],
    toDOM(): DOMOutputSpec {
      return ["pre", ["code", 0]];
    },
  };
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce(docSpec);
  const textExtension = mockNodeExtension();
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const markExtension1 = mockMarkExtension();
  markExtension1.proseMirrorMarkName.mockReturnValueOnce("MARK_1");
  const markSpec = {
    attrs: { href: { default: null } },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(dom: Node | string): {
          href: string | null;
        } {
          return {
            href: (dom as HTMLElement).getAttribute("href"),
          };
        },
      },
    ],
    toDOM(node: Mark): DOMOutputSpec {
      return ["a", node.attrs];
    },
  };
  markExtension1.proseMirrorMarkSpec.mockReturnValueOnce(markSpec);

  const manager = mockExtensionManager();
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
