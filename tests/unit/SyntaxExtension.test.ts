import { expect, test } from "vitest";

import { MockSyntaxExtension } from "../mocks/MockSyntaxExtension";

test("SyntaxExtension.unistToProseMirrorTest has a default implementation", () => {
  const extension = new MockSyntaxExtension();
  extension.unistNodeName.mockReturnValue("node1");

  expect(extension.unistToProseMirrorTest({ type: "node1" })).toBe(true);
  expect(extension.unistToProseMirrorTest({ type: "node2" })).toBe(false);
});

test("SyntaxExtension.postUnistToProseMirrorHook has a default implementation", () => {
  expect.assertions(1);

  const extension = new MockSyntaxExtension<
    { type: "node1" },
    { value: string }
  >();
  const context = { value: "KEPT" };

  extension.postUnistToProseMirrorHook(context);

  // The default hook does nothing, leaving the context alone.
  expect(context).toStrictEqual({ value: "KEPT" });
});
