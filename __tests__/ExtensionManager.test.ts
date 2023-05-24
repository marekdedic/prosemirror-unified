import { mocked } from "jest-mock";

import { ExtensionManager } from "../src/ExtensionManager";
import { MockMarkExtension } from "./MockMarkExtension";
import { MockNodeExtension } from "./MockNodeExtension";

test("ExtensionManager manages mark extensions", () => {
  const markExtension = mocked(new MockMarkExtension());
  const manager = new ExtensionManager([markExtension]);

  expect(manager.extensions()).toStrictEqual([markExtension]);
  expect(manager.markExtensions()).toStrictEqual([markExtension]);
  expect(manager.nodeExtensions()).toStrictEqual([]);
  expect(manager.syntaxExtensions()).toStrictEqual([markExtension]);
});

test("ExtensionManager manages node extensions", () => {
  const nodeExtension = mocked(new MockNodeExtension());
  const manager = new ExtensionManager([nodeExtension]);

  expect(manager.extensions()).toStrictEqual([nodeExtension]);
  expect(manager.markExtensions()).toStrictEqual([]);
  expect(manager.nodeExtensions()).toStrictEqual([nodeExtension]);
  expect(manager.syntaxExtensions()).toStrictEqual([nodeExtension]);
});

test("ExtensionManager manages mixed mark and node extensions", () => {
  const markExtension = mocked(new MockMarkExtension());
  const nodeExtension = mocked(new MockNodeExtension());
  const manager = new ExtensionManager([markExtension, nodeExtension]);

  expect(manager.extensions()).toStrictEqual([nodeExtension, markExtension]);
  expect(manager.markExtensions()).toStrictEqual([markExtension]);
  expect(manager.nodeExtensions()).toStrictEqual([nodeExtension]);
  expect(manager.syntaxExtensions()).toStrictEqual([
    nodeExtension,
    markExtension,
  ]);
});

// TODO: Multiple extensions of the same type
