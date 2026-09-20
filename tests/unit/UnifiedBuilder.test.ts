import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { expect, test, vi } from "vitest";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";

vi.mock("../../src/Extension");
vi.mock("../../src/ExtensionManager");

type UnifiedProcessor = Processor<
  UnistNode,
  UnistNode,
  UnistNode,
  UnistNode,
  string
>;

test("UnifiedBuilder chains the extension hooks", () => {
  class Extension1 extends Extension {}
  class Extension2 extends Extension {}

  // Distinct sentinels, so that the chaining is observable.
  const firstProcessor = { name: "FIRST" } as unknown as UnifiedProcessor;
  const secondProcessor = { name: "SECOND" } as unknown as UnifiedProcessor;

  const extension1 = vi.mocked(new Extension1());
  extension1.unifiedInitializationHook.mockReturnValueOnce(firstProcessor);
  const extension2 = vi.mocked(new Extension2());
  extension2.unifiedInitializationHook.mockReturnValueOnce(secondProcessor);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.extensions.mockReturnValueOnce([extension1, extension2]);

  const builder = new UnifiedBuilder(manager);
  const processor = builder.build();

  // The first hook receives a real unified processor.
  expect(extension1.unifiedInitializationHook).toHaveBeenCalledTimes(1);
  expect(extension1.unifiedInitializationHook.mock.calls[0][0]).toHaveProperty(
    "use",
  );
  // Each subsequent hook receives what the previous one returned.
  // The result of the last hook is what gets built.
  expect(extension2.unifiedInitializationHook).toHaveBeenCalledTimes(1);
  expect(extension2.unifiedInitializationHook).toHaveBeenCalledWith(
    firstProcessor,
  );
  expect(processor).toBe(secondProcessor);
});
