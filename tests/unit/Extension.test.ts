import type { Node as UnistNode } from "unist";

import { Schema } from "prosemirror-model";
import { type Processor, unified } from "unified";
import { expect, test } from "vitest";

import { Extension } from "../../src/Extension";

test("Extension.dependencies has a default implementation", () => {
  class MockExtension extends Extension {}
  const extension = new MockExtension();

  expect(extension.dependencies()).toStrictEqual([]);
});

test("Extension.unifiedInitializationHook has a default implementation", () => {
  class MockExtension extends Extension {}
  const extension = new MockExtension();

  const processor = unified() as unknown as Processor<
    UnistNode,
    UnistNode,
    UnistNode,
    UnistNode,
    string
  >;

  expect(extension.unifiedInitializationHook(processor)).toBe(processor);
});

test("Extension.proseMirrorPlugins has a default implementation", () => {
  class MockExtension extends Extension {}
  const extension = new MockExtension();
  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  expect(extension.proseMirrorPlugins(schema)).toStrictEqual([]);
});
