import { expect, test, vi } from "vitest";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";

vi.mock("../../src/Extension");
vi.mock("../../src/ExtensionManager");

test("UnifiedBuilder uses extension hooks", () => {
  class MockExtension extends Extension {}

  const extension = vi.mocked(new MockExtension());
  extension.unifiedInitializationHook.mockImplementationOnce(
    (processor) => processor,
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.extensions.mockReturnValueOnce([extension]);

  const builder = new UnifiedBuilder(manager);
  const processor = builder.build();

  expect(extension.unifiedInitializationHook).toHaveBeenCalledWith(processor);
});
