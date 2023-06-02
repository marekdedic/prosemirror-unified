import { mocked } from "jest-mock";
import { Plugin } from "prosemirror-state";

import { ExtensionManager } from "../src/ExtensionManager";
import { KeymapBuilder } from "../src/KeymapBuilder";
import { MockNodeExtension } from "./MockNodeExtension";

test("KeymapBuilder creates a plugin", () => {
  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeSpec.mockReturnValueOnce({});
  const textExtension = mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeSpec.mockReturnValueOnce({});

  const manager = new ExtensionManager([docExtension, textExtension]);

  const builder = new KeymapBuilder(manager);
  const rules = builder.build();

  expect(rules).toBeInstanceOf(Plugin);
});
