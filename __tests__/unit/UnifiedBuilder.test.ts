import { mocked } from "jest-mock";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";

jest.mock("../../src/Extension");
jest.mock("../../src/ExtensionManager");

test("UnifiedBuilder builds an empty processor", () => {
  const manager = mocked(new ExtensionManager([]));
  manager.extensions.mockReturnValueOnce([]);

  const builder = new UnifiedBuilder(manager);
  const unified = builder.build();

  expect(unified).toBeInstanceOf(Function);
});

test("UnifiedBuilder uses extension hooks", () => {
  class MockExtension extends Extension {}

  const extension = mocked(new MockExtension());
  extension.unifiedInitializationHook.mockImplementationOnce(
    (processor) => processor
  );

  const manager = mocked(new ExtensionManager([]));
  manager.extensions.mockReturnValueOnce([extension]);

  const builder = new UnifiedBuilder(manager);
  const processor = builder.build();

  expect(processor).toBeInstanceOf(Function);
  expect(extension.unifiedInitializationHook).toHaveBeenCalledWith(processor);
});
