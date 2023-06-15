import { Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { MockSyntaxExtension } from "../mocks/MockSyntaxExtension";

test("SyntaxExtension manages schema", () => {
  class ExposeMethod<
    UNode extends UnistNode,
    Context extends Record<string, unknown> = Record<string, never>
  > extends MockSyntaxExtension<UNode, Context> {
    public exposeSchema(): Schema<string, string> {
      return this.proseMirrorSchema();
    }
  }
  const extension = new ExposeMethod();
  const schema = new Schema<string, string>({
    nodes: {
      doc: {},
      text: {},
    },
  });

  expect(extension.exposeSchema()).toBeUndefined();
  extension.setProseMirrorSchema(schema);
  expect(extension.exposeSchema()).toBe(schema);
});

test("SyntaxExtension.unistToProseMirrorTest has a default implementation", () => {
  const extension = new MockSyntaxExtension();
  extension.unistNodeName.mockReturnValue("node1");

  expect(extension.unistToProseMirrorTest({ type: "node1" })).toBe(true);
  expect(extension.unistToProseMirrorTest({ type: "node2" })).toBe(false);
});

test("SyntaxExtension.proseMirrorInputRules has a default implementation", () => {
  const extension = new MockSyntaxExtension();

  expect(extension.proseMirrorInputRules()).toStrictEqual([]);
});

test("SyntaxExtension.proseMirrorKeymap has a default implementation", () => {
  const extension = new MockSyntaxExtension();

  expect(extension.proseMirrorKeymap()).toStrictEqual({});
});
