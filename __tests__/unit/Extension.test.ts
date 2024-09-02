import type { Node as UnistNode } from "unist";

import { type Processor, unified } from "unified";

import { Extension } from "../../src/Extension";

test("Extension.dependencies has a default implementation", () => {
  class MockExtension extends Extension {}
  const extension = new MockExtension();

  expect(extension).toBeInstanceOf(Extension);

  expect(extension.dependencies()).toStrictEqual([]);
});

test("Extension.unifiedInitializationHook has a default implementation", () => {
  class MockExtension extends Extension {}
  const extension = new MockExtension();

  expect(extension).toBeInstanceOf(Extension);

  const processor = unified() as unknown as Processor<
    UnistNode,
    UnistNode,
    UnistNode,
    UnistNode,
    string
  >;

  expect(extension.unifiedInitializationHook(processor)).toBe(processor);
});
