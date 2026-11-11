import type { Node as UnistNode } from "unist";

import { describe, expect, test, vi } from "vitest";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

vi.mock("../../src/Extension");
vi.mock("../../src/SyntaxExtension");

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

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
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const manager = new ExtensionManager([extension1, extension2]);

  expect(manager.extensions()).toStrictEqual([extension2]);
  expect(console.warn).toHaveBeenCalledExactlyOnceWith(
    "Extension MockExtension was passed more than once, using the last instance.",
  );
  expect(extension1.dependencies).not.toHaveBeenCalled();
  expect(extension2.dependencies).toHaveBeenCalledExactlyOnceWith();
});

test("ExtensionManager doesn't warn about the same instance passed twice", () => {
  class MockExtension extends Extension {}
  const extension = vi.mocked(new MockExtension());
  extension.dependencies.mockReturnValueOnce([]);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const manager = new ExtensionManager([extension, extension]);

  expect(manager.extensions()).toStrictEqual([extension]);
  expect(console.warn).not.toHaveBeenCalled();
  expect(extension.dependencies).toHaveBeenCalledExactlyOnceWith();
});

test("ExtensionManager doesn't warn about dependencies of the same class", () => {
  class SharedExtension extends Extension {}
  class DependerExtension1 extends Extension {}
  class DependerExtension2 extends Extension {}
  const sharedExtension1 = vi.mocked(new SharedExtension());
  sharedExtension1.dependencies.mockReturnValueOnce([]);
  const sharedExtension2 = vi.mocked(new SharedExtension());
  sharedExtension2.dependencies.mockReturnValueOnce([]);
  const dependerExtension1 = vi.mocked(new DependerExtension1());
  dependerExtension1.dependencies.mockReturnValueOnce([sharedExtension1]);
  const dependerExtension2 = vi.mocked(new DependerExtension2());
  dependerExtension2.dependencies.mockReturnValueOnce([sharedExtension2]);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const manager = new ExtensionManager([
    dependerExtension1,
    dependerExtension2,
  ]);

  expect(manager.extensions()).toStrictEqual([
    sharedExtension2,
    dependerExtension1,
    dependerExtension2,
  ]);
  expect(console.warn).not.toHaveBeenCalled();
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

describe("ExtensionManager prefers directly passed extensions over dependencies", () => {
  class FirstExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class ConfiguredExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class LastExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class LeafExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class BundleExtension extends Extension {}

  const setUp = (): {
    bundleExtension: BundleExtension;
    configuredExtension: ConfiguredExtension<UnistNode>;
    dependencyExtension: ConfiguredExtension<UnistNode>;
    firstExtension: FirstExtension<UnistNode>;
    lastExtension: LastExtension<UnistNode>;
    leafExtension: LeafExtension<UnistNode>;
  } => {
    const firstExtension = vi.mocked(new FirstExtension());
    firstExtension.dependencies.mockReturnValueOnce([]);
    const dependencyExtension = vi.mocked(new ConfiguredExtension());
    dependencyExtension.dependencies.mockReturnValueOnce([]);
    const lastExtension = vi.mocked(new LastExtension());
    lastExtension.dependencies.mockReturnValueOnce([]);
    const bundleExtension = vi.mocked(new BundleExtension());
    bundleExtension.dependencies.mockReturnValueOnce([
      firstExtension,
      dependencyExtension,
      lastExtension,
    ]);
    const leafExtension = vi.mocked(new LeafExtension());
    leafExtension.dependencies.mockReturnValueOnce([]);
    const configuredExtension = vi.mocked(new ConfiguredExtension());
    configuredExtension.dependencies.mockReturnValueOnce([leafExtension]);
    return {
      bundleExtension,
      configuredExtension,
      dependencyExtension,
      firstExtension,
      lastExtension,
      leafExtension,
    };
  };

  test("when passed after the extension depending on it", () => {
    const {
      bundleExtension,
      configuredExtension,
      dependencyExtension,
      firstExtension,
      lastExtension,
      leafExtension,
    } = setUp();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const manager = new ExtensionManager([
      bundleExtension,
      configuredExtension,
    ]);

    expect(manager.extensions()).toStrictEqual([
      firstExtension,
      leafExtension,
      configuredExtension,
      lastExtension,
      bundleExtension,
    ]);
    expect(dependencyExtension.dependencies).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("when passed before the extension depending on it", () => {
    const {
      bundleExtension,
      configuredExtension,
      dependencyExtension,
      firstExtension,
      lastExtension,
      leafExtension,
    } = setUp();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const manager = new ExtensionManager([
      configuredExtension,
      bundleExtension,
    ]);

    // The configured extension takes the dependency's position.
    expect(manager.extensions()).toStrictEqual([
      firstExtension,
      leafExtension,
      configuredExtension,
      lastExtension,
      bundleExtension,
    ]);
    expect(configuredExtension.dependencies).toHaveBeenCalledExactlyOnceWith();
    expect(dependencyExtension.dependencies).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});

test("ExtensionManager prefers directly passed extensions over transitive dependencies", () => {
  class LeafExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class MiddleExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class TopExtension extends Extension {}

  const dependencyLeafExtension = vi.mocked(new LeafExtension());
  dependencyLeafExtension.dependencies.mockReturnValueOnce([]);
  const middleExtension = vi.mocked(new MiddleExtension());
  middleExtension.dependencies.mockReturnValueOnce([dependencyLeafExtension]);
  const topExtension = vi.mocked(new TopExtension());
  topExtension.dependencies.mockReturnValueOnce([middleExtension]);
  const leafExtension = vi.mocked(new LeafExtension());
  leafExtension.dependencies.mockReturnValueOnce([]);

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const manager = new ExtensionManager([leafExtension, topExtension]);

  expect(manager.extensions()).toStrictEqual([
    leafExtension,
    middleExtension,
    topExtension,
  ]);
  expect(dependencyLeafExtension.dependencies).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
});

test("ExtensionManager adds a directly passed extension at its first dependency position", () => {
  class FirstExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class LeafExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class ConfiguredExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class DependerExtension1 extends Extension {}
  class DependerExtension2 extends Extension {}

  const leafExtension = vi.mocked(new LeafExtension());
  leafExtension.dependencies.mockReturnValueOnce([]);
  const configuredExtension = vi.mocked(new ConfiguredExtension());
  configuredExtension.dependencies.mockReturnValueOnce([leafExtension]);
  const firstExtension = vi.mocked(new FirstExtension());
  firstExtension.dependencies.mockReturnValueOnce([]);
  const dependencyExtension1 = vi.mocked(new ConfiguredExtension());
  const dependencyExtension2 = vi.mocked(new ConfiguredExtension());
  const dependerExtension1 = vi.mocked(new DependerExtension1());
  dependerExtension1.dependencies.mockReturnValueOnce([
    firstExtension,
    dependencyExtension1,
  ]);
  const dependerExtension2 = vi.mocked(new DependerExtension2());
  dependerExtension2.dependencies.mockReturnValueOnce([dependencyExtension2]);

  const manager = new ExtensionManager([
    configuredExtension,
    dependerExtension1,
    dependerExtension2,
  ]);

  // The configured extension's own dependencies move with it.
  expect(manager.nodeExtensions()).toStrictEqual([
    firstExtension,
    leafExtension,
    configuredExtension,
  ]);
  expect(manager.extensions()).toStrictEqual([
    firstExtension,
    leafExtension,
    configuredExtension,
    dependerExtension1,
    dependerExtension2,
  ]);
  expect(dependencyExtension1.dependencies).not.toHaveBeenCalled();
  expect(dependencyExtension2.dependencies).not.toHaveBeenCalled();
});

test("ExtensionManager keeps the position of a directly passed extension nothing depends on", () => {
  class NodeExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class NodeExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class BundleExtension extends Extension {}

  const nodeExtension2 = vi.mocked(new NodeExtension2());
  nodeExtension2.dependencies.mockReturnValueOnce([]);
  const bundleExtension = vi.mocked(new BundleExtension());
  bundleExtension.dependencies.mockReturnValueOnce([nodeExtension2]);
  const nodeExtension1 = vi.mocked(new NodeExtension1());
  nodeExtension1.dependencies.mockReturnValueOnce([]);

  const manager = new ExtensionManager([nodeExtension1, bundleExtension]);

  expect(manager.nodeExtensions()).toStrictEqual([
    nodeExtension1,
    nodeExtension2,
  ]);
});

test("ExtensionManager uses the last of several directly passed instances in place of a dependency", () => {
  class ConfiguredExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class FirstExtension<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class BundleExtension extends Extension {}

  const firstExtension = vi.mocked(new FirstExtension());
  firstExtension.dependencies.mockReturnValueOnce([]);
  const dependencyExtension = vi.mocked(new ConfiguredExtension());
  const bundleExtension = vi.mocked(new BundleExtension());
  bundleExtension.dependencies.mockReturnValueOnce([
    firstExtension,
    dependencyExtension,
  ]);
  const configuredExtension1 = vi.mocked(new ConfiguredExtension());
  const configuredExtension2 = vi.mocked(new ConfiguredExtension());
  configuredExtension2.dependencies.mockReturnValueOnce([]);
  vi.spyOn(console, "warn").mockImplementation(() => {});

  const manager = new ExtensionManager([
    configuredExtension1,
    bundleExtension,
    configuredExtension2,
  ]);

  expect(manager.extensions()).toStrictEqual([
    firstExtension,
    configuredExtension2,
    bundleExtension,
  ]);
  expect(console.warn).toHaveBeenCalledExactlyOnceWith(
    "Extension ConfiguredExtension was passed more than once, using the last instance.",
  );
  expect(configuredExtension1.dependencies).not.toHaveBeenCalled();
});

test("ExtensionManager adds a directly passed extension only reachable through a dependency cycle", () => {
  class CycleExtension1<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}
  class CycleExtension2<
    HandledUnistNode extends UnistNode,
  > extends MockNodeExtension<HandledUnistNode> {}

  const extension = vi.mocked(new CycleExtension1());
  const dependencyExtension = vi.mocked(new CycleExtension2());
  extension.dependencies.mockReturnValueOnce([dependencyExtension]);
  dependencyExtension.dependencies.mockReturnValueOnce([
    vi.mocked(new CycleExtension1()),
  ]);

  const manager = new ExtensionManager([extension]);

  expect(manager.extensions()).toStrictEqual([dependencyExtension, extension]);
});

/* eslint-enable */
