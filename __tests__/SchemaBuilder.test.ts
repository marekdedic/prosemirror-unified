import { SchemaBuilder } from "../src/SchemaBuilder";
import { mockExtensionManager } from "./mockExtensionManager";
import { mockNodeExtension } from "./mockNodeExtension";

describe("SchemaBuilder works", () => {
  const manager = mockExtensionManager();
  const docExtension = mockNodeExtension();
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = mockNodeExtension();
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  manager.markExtensions.mockReturnValueOnce([]);
  manager.nodeExtensions.mockReturnValueOnce([docExtension, textExtension]);
  const builder = new SchemaBuilder(manager);

  expect(builder.build()).toEqual({});
});
