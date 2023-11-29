import { mocked } from "jest-mock";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";

jest.mock("../../src/Extension");
jest.mock("../../src/ExtensionManager");

test("UnifiedBuilder uses extension hooks", () => {
  class MockExtension extends Extension {}

  const extension = mocked(new MockExtension());
  extension.unifiedInitializationHook.mockImplementationOnce(
    (processor) => processor,
  );

  const manager = mocked(new ExtensionManager([]));
  manager.extensions.mockReturnValueOnce([extension]);

  const builder = new UnifiedBuilder(manager);
  const processor = builder.build();

  expect(extension.unifiedInitializationHook).toHaveBeenCalledWith(processor);
});
