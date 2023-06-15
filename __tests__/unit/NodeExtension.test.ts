import { type Attrs, Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { Extension } from "../../src/Extension";
import { NodeExtension } from "../../src/NodeExtension";
import { SyntaxExtension } from "../../src/SyntaxExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

test("NodeExtension.proseMirrorToUnistTest has a default implementation", () => {
  const extension = new MockNodeExtension();
  extension.proseMirrorNodeName.mockReturnValue("node1");
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
      node1: {},
      node2: {},
    },
    marks: {},
  });
  const node1 = schema.nodes["node1"].create();
  const node2 = schema.nodes["node2"].create();

  expect(extension).toBeInstanceOf(NodeExtension);
  expect(extension).toBeInstanceOf(SyntaxExtension);
  expect(extension).toBeInstanceOf(Extension);

  expect(extension.proseMirrorToUnistTest(node1)).toBe(true);
  expect(extension.proseMirrorToUnistTest(node2)).toBe(false);
});

describe("NodeExtension.createProseMirrorNodeHelper has a default implementation", () => {
  class ExposeMethod<
    UNode extends UnistNode,
    Context extends Record<string, unknown> = Record<string, never>
  > extends MockNodeExtension<UNode, Context> {
    public proseMirrorSchema = jest.fn<Schema<string, string>, []>();

    public test(
      children: Array<ProseMirrorNode>,
      attrs: Attrs | undefined = undefined
    ): Array<ProseMirrorNode> {
      if (attrs !== undefined) {
        return this.createProseMirrorNodeHelper(children, attrs);
      }
      return this.createProseMirrorNodeHelper(children);
    }
  }
  const extension = new ExposeMethod();
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
      node1: {
        content: "group1*",
        attrs: {
          attr1: { default: "attr1_default" },
        },
      },
      node2: {
        group: "group1",
      },
      node3: {
        group: "group1",
      },
      node4: {},
    },
    marks: {},
  });

  beforeEach(() => {
    extension.proseMirrorNodeName.mockReturnValue("node1");
    extension.proseMirrorSchema.mockReturnValue(schema);
  });

  test("works with a basic node", () => {
    const result = extension.test([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs["attr1"]).toBe("attr1_default");
    expect(result[0].attrs["attr2"]).toBeUndefined();
  });

  test("works with children", () => {
    const result = extension.test([
      schema.nodes["node2"].create(),
      schema.nodes["node3"].create(),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(2);
    expect(result[0].attrs["attr1"]).toBe("attr1_default");
    expect(result[0].attrs["attr2"]).toBeUndefined();
  });

  test("works with attributes", () => {
    const result = extension.test([], { attr1: "value1" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs["attr1"]).toBe("value1");
    expect(result[0].attrs["attr2"]).toBeUndefined();
  });

  test("works with invalid children", () => {
    expect(extension.test([schema.nodes["node4"].create()])).toHaveLength(0);
  });

  test("works with invalid attributes", () => {
    const result = extension.test([], { attr2: "value1" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs["attr1"]).toBe("attr1_default");
    expect(result[0].attrs["attr2"]).toBeUndefined();
  });

  test("works with null node", () => {
    extension.proseMirrorNodeName.mockReturnValue(null);
    expect(extension.test([])).toHaveLength(0);
  });
});
