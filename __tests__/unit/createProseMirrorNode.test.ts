import { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { createProseMirrorNode } from "../../src/createProseMirrorNode";

describe("createProseMirrorNode works", () => {
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

  test("works with a basic node", () => {
    const result = createProseMirrorNode("node1", schema, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs.attr1).toBe("attr1_default");
    expect(result[0].attrs.attr2).toBeUndefined();
  });

  test("works with children", () => {
    const result = createProseMirrorNode("node1", schema, [
      schema.nodes.node2.create(),
      schema.nodes.node3.create(),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(2);
    expect(result[0].attrs.attr1).toBe("attr1_default");
    expect(result[0].attrs.attr2).toBeUndefined();
  });

  test("works with attributes", () => {
    const result = createProseMirrorNode("node1", schema, [], {
      attr1: "value1",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs.attr1).toBe("value1");
    expect(result[0].attrs.attr2).toBeUndefined();
  });

  test("works with invalid children", () => {
    expect(
      createProseMirrorNode("node1", schema, [schema.nodes.node4.create()]),
    ).toHaveLength(0);
  });

  test("works with invalid attributes", () => {
    const result = createProseMirrorNode("node1", schema, [], {
      attr2: "value1",
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ProseMirrorNode);
    expect(result[0].type.name).toBe("node1");
    expect(result[0].childCount).toBe(0);
    expect(result[0].attrs.attr1).toBe("attr1_default");
    expect(result[0].attrs.attr2).toBeUndefined();
  });

  test("works with null node", () => {
    expect(createProseMirrorNode(null, schema, [])).toHaveLength(0);
  });
});
