import type { Node as UnistNode } from "unist";

import { expect, test, vi } from "vitest";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

vi.mock("../../src/Extension");
vi.mock("../../src/SyntaxExtension");

test("ExtensionManager manages mark extensions", () => {
  const markExtension = vi.mocked(new MockMarkExtension());
  markExtension.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([markExtension]);

  expect(manager.extensions()).toStrictEqual([markExtension]);
  expect(manager.markExtensions()).toStrictEqual([markExtension]);
  expect(manager.nodeExtensions()).toStrictEqual([]);
  expect(manager.syntaxExtensions()).toStrictEqual([markExtension]);
});

test("ExtensionManager manages node extensions", () => {
  const nodeExtension = vi.mocked(new MockNodeExtension());
  nodeExtension.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([nodeExtension]);

  expect(manager.extensions()).toStrictEqual([nodeExtension]);
  expect(manager.markExtensions()).toStrictEqual([]);
  expect(manager.nodeExtensions()).toStrictEqual([nodeExtension]);
  expect(manager.syntaxExtensions()).toStrictEqual([nodeExtension]);
});

test("ExtensionManager manages other extensions", () => {
  class MockExtension extends Extension {}
  const extension = vi.mocked(new MockExtension());
  extension.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([extension]);

  expect(manager.extensions()).toStrictEqual([extension]);
  expect(manager.markExtensions()).toStrictEqual([]);
  expect(manager.nodeExtensions()).toStrictEqual([]);
  expect(manager.syntaxExtensions()).toStrictEqual([]);
});

test("ExtensionManager manages mark and node extensions", () => {
  class MarkExtension1<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class MarkExtension2<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class NodeExtension1<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class NodeExtension2<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class MockExtension1 extends Extension {}
  class MockExtension2 extends Extension {}
  const markExtension1 = vi.mocked(new MarkExtension1());
  markExtension1.dependencies.mockReturnValueOnce([]);
  const markExtension2 = vi.mocked(new MarkExtension2());
  markExtension2.dependencies.mockReturnValueOnce([]);
  const nodeExtension1 = vi.mocked(new NodeExtension1());
  nodeExtension1.dependencies.mockReturnValueOnce([]);
  const nodeExtension2 = vi.mocked(new NodeExtension2());
  nodeExtension2.dependencies.mockReturnValueOnce([]);
  const extension1 = vi.mocked(new MockExtension1());
  extension1.dependencies.mockReturnValueOnce([]);
  const extension2 = vi.mocked(new MockExtension2());
  extension2.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([
    markExtension1,
    markExtension2,
    nodeExtension1,
    nodeExtension2,
    extension1,
    extension2,
  ]);

  expect(manager.extensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
    markExtension1,
    markExtension2,
    extension1,
    extension2,
  ]);
  expect(manager.markExtensions()).toStrictEqual([
    markExtension1,
    markExtension2,
  ]);
  expect(manager.nodeExtensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
  ]);
  expect(manager.syntaxExtensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
    markExtension1,
    markExtension2,
  ]);
});

test("ExtensionManager manages extensions with dependencies", () => {
  class MarkExtension1<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class MarkExtension2<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class NodeExtension1<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class NodeExtension2<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class MockExtension1 extends Extension {}
  const markExtension1 = vi.mocked(new MarkExtension1());
  markExtension1.dependencies.mockReturnValueOnce([]);
  const markExtension2 = vi.mocked(new MarkExtension2());
  markExtension2.dependencies.mockReturnValueOnce([]);
  const nodeExtension1 = vi.mocked(new NodeExtension1());
  nodeExtension1.dependencies.mockReturnValueOnce([]);
  const nodeExtension2 = vi.mocked(new NodeExtension2());
  nodeExtension2.dependencies.mockReturnValueOnce([]);
  const extension1 = vi.mocked(new MockExtension1());
  extension1.dependencies.mockReturnValueOnce([
    markExtension1,
    markExtension2,
    nodeExtension1,
    nodeExtension2,
  ]);
  const manager = new ExtensionManager([extension1]);

  expect(manager.extensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
    markExtension1,
    markExtension2,
    extension1,
  ]);
  expect(manager.markExtensions()).toStrictEqual([
    markExtension1,
    markExtension2,
  ]);
  expect(manager.nodeExtensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
  ]);
  expect(manager.syntaxExtensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
    markExtension1,
    markExtension2,
  ]);
});
