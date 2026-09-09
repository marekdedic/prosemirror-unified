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
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class MarkExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class NodeExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class NodeExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
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

test("ExtensionManager distinguishes extensions with the same constructor name", () => {
  const MarkExtension1 = class n<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {};
  const MarkExtension2 = class n<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {};
  const NodeExtension1 = class n<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {};
  const NodeExtension2 = class n<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {};
  const Extension1 = class n extends Extension {};
  const Extension2 = class n extends Extension {};
  const markExtension1 = vi.mocked(new MarkExtension1());
  markExtension1.dependencies.mockReturnValueOnce([]);
  const markExtension2 = vi.mocked(new MarkExtension2());
  markExtension2.dependencies.mockReturnValueOnce([]);
  const nodeExtension1 = vi.mocked(new NodeExtension1());
  nodeExtension1.dependencies.mockReturnValueOnce([]);
  const nodeExtension2 = vi.mocked(new NodeExtension2());
  nodeExtension2.dependencies.mockReturnValueOnce([]);
  const extension1 = vi.mocked(new Extension1());
  extension1.dependencies.mockReturnValueOnce([]);
  const extension2 = vi.mocked(new Extension2());
  extension2.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([
    markExtension1,
    markExtension2,
    nodeExtension1,
    nodeExtension2,
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
  expect(manager.extensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
    markExtension1,
    markExtension2,
    extension1,
    extension2,
  ]);
});

test("ExtensionManager deduplicates instances of the same extension", () => {
  class MockExtension extends Extension {}
  const extension1 = vi.mocked(new MockExtension());
  extension1.dependencies.mockReturnValueOnce([]);
  const extension2 = vi.mocked(new MockExtension());
  extension2.dependencies.mockReturnValueOnce([]);
  const manager = new ExtensionManager([extension1, extension2]);

  expect(manager.extensions()).toStrictEqual([extension2]);
});

test("ExtensionManager manages extensions with dependencies", () => {
  class MarkExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class MarkExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class NodeExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class NodeExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
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

test("ExtensionManager manages transitive dependencies", () => {
  expect.assertions(4);

  class LeafExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class MiddleExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class TopExtension extends Extension {}

  const leafExtension = vi.mocked(new LeafExtension());
  leafExtension.dependencies.mockReturnValueOnce([]);
  const middleExtension = vi.mocked(new MiddleExtension());
  middleExtension.dependencies.mockReturnValueOnce([leafExtension]);
  const topExtension = vi.mocked(new TopExtension());
  topExtension.dependencies.mockReturnValueOnce([middleExtension]);

  const manager = new ExtensionManager([topExtension]);

  expect(manager.nodeExtensions()).toStrictEqual([
    leafExtension,
    middleExtension,
  ]);
  expect(manager.markExtensions()).toStrictEqual([]);
  expect(manager.syntaxExtensions()).toStrictEqual([
    leafExtension,
    middleExtension,
  ]);
  // Dependencies come before the extension that depends on them.
  expect(manager.extensions()).toStrictEqual([
    leafExtension,
    middleExtension,
    topExtension,
  ]);
});

test("ExtensionManager deduplicates a shared transitive dependency", () => {
  expect.assertions(3);

  class FirstNodeExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class SharedExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class LastNodeExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class DependerExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class DependerExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockMarkExtension<HandledUnistNode> {}
  class TopExtension extends Extension {}

  const firstNodeExtension = vi.mocked(new FirstNodeExtension());
  firstNodeExtension.dependencies.mockReturnValueOnce([]);
  const sharedExtension1 = vi.mocked(new SharedExtension());
  sharedExtension1.dependencies.mockReturnValueOnce([]);
  const sharedExtension2 = vi.mocked(new SharedExtension());
  sharedExtension2.dependencies.mockReturnValueOnce([]);
  const sharedExtension3 = vi.mocked(new SharedExtension());
  sharedExtension3.dependencies.mockReturnValueOnce([]);
  const lastNodeExtension = vi.mocked(new LastNodeExtension());
  lastNodeExtension.dependencies.mockReturnValueOnce([]);
  const dependerExtension1 = vi.mocked(new DependerExtension1());
  dependerExtension1.dependencies.mockReturnValueOnce([sharedExtension2]);
  const dependerExtension2 = vi.mocked(new DependerExtension2());
  dependerExtension2.dependencies.mockReturnValueOnce([sharedExtension3]);

  // The shared extension is reachable directly and through both dependers.
  const topExtension = vi.mocked(new TopExtension());
  topExtension.dependencies.mockReturnValueOnce([
    firstNodeExtension,
    sharedExtension1,
    dependerExtension1,
    lastNodeExtension,
    dependerExtension2,
  ]);

  const manager = new ExtensionManager([topExtension]);

  // The extension keeps the position of its first occurrence, so an extension
  // Listed first stays the first node extension - and therefore the default
  // ProseMirror block - no matter what depends on what.
  expect(manager.nodeExtensions()).toStrictEqual([
    firstNodeExtension,
    sharedExtension3,
    lastNodeExtension,
  ]);
  expect(manager.markExtensions()).toStrictEqual([
    dependerExtension1,
    dependerExtension2,
  ]);
  expect(manager.extensions()).toStrictEqual([
    firstNodeExtension,
    sharedExtension3,
    lastNodeExtension,
    dependerExtension1,
    dependerExtension2,
    topExtension,
  ]);
});
