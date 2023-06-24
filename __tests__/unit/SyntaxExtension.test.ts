import { Schema } from "prosemirror-model";

import { MockSyntaxExtension } from "../mocks/MockSyntaxExtension";

test("SyntaxExtension.unistToProseMirrorTest has a default implementation", () => {
  const extension = new MockSyntaxExtension();
  extension.unistNodeName.mockReturnValue("node1");

  expect(extension.unistToProseMirrorTest({ type: "node1" })).toBe(true);
  expect(extension.unistToProseMirrorTest({ type: "node2" })).toBe(false);
});

test("SyntaxExtension.proseMirrorInputRules has a default implementation", () => {
  const extension = new MockSyntaxExtension();
  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  expect(extension.proseMirrorInputRules(schema)).toStrictEqual([]);
});

test("SyntaxExtension.proseMirrorKeymap has a default implementation", () => {
  const extension = new MockSyntaxExtension();
  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  expect(extension.proseMirrorKeymap(schema)).toStrictEqual({});
});
