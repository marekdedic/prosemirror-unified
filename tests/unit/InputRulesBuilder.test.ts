import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { expect, test, vi } from "vitest";

import { ExtensionManager } from "../../src/ExtensionManager";
import { InputRulesBuilder } from "../../src/InputRulesBuilder";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

test("InputRulesBuilder creates a plugin", () => {
  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = new ExtensionManager([docExtension, textExtension]);
  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  const builder = new InputRulesBuilder(manager, schema);
  const rules = builder.build();

  expect(rules).toBeInstanceOf(Plugin);
});
