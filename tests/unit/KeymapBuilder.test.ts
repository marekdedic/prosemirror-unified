import type { Command } from "prosemirror-state";

import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { expect, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { ExtensionManager } from "../../src/ExtensionManager";
import { KeymapBuilder } from "../../src/KeymapBuilder";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

const schema = new Schema<string, string>({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: (): DOMOutputSpec => ["p", 0] },
    text: {},
  },
});

// The two extensions need distinct classes because ExtensionManager
// deduplicates extensions by their constructor name.
class FirstExtension extends MockNodeExtension<{ type: "first" }> {
  public override proseMirrorKeymap = vi.fn<() => Record<string, Command>>(
    () => ({}),
  );
}

class SecondExtension extends MockNodeExtension<{ type: "second" }> {
  public override proseMirrorKeymap = vi.fn<() => Record<string, Command>>(
    () => ({}),
  );
}

const pressKey = (
  keymaps: Array<Record<string, Command>>,
  key: string,
  modifiers?: { ctrlKey?: boolean },
): ProseMirrorTester => {
  const first = new FirstExtension();
  first.proseMirrorKeymap.mockReturnValue(keymaps[0]);
  const second = new SecondExtension();
  second.proseMirrorKeymap.mockReturnValue(keymaps[1]);

  const builder = new KeymapBuilder(
    new ExtensionManager([first, second]),
    schema,
  );
  const testEditor = new ProseMirrorTester(
    schema.nodes["doc"].create(null, schema.nodes["paragraph"].create()),
    { plugins: [builder.build()] },
  );

  testEditor.selectText("end");
  testEditor.insertText(key, modifiers);

  return testEditor;
};

test("KeymapBuilder chains commands bound to the same key", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => false);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-b": secondCommand }], "b", {
    ctrlKey: true,
  });

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).toHaveBeenCalledTimes(1);
});

test("KeymapBuilder stops chaining once a command succeeds", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => true);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-b": secondCommand }], "b", {
    ctrlKey: true,
  });

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).not.toHaveBeenCalled();
});

test("KeymapBuilder keeps commands bound to different keys apart", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => true);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-i": secondCommand }], "b", {
    ctrlKey: true,
  });

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).not.toHaveBeenCalled();
});

test("KeymapBuilder falls back to the base keymap", () => {
  expect.assertions(2);

  const enterCommand = vi.fn<Command>(() => false);

  const testEditor = pressKey([{ Enter: enterCommand }, {}], "{Enter}");

  expect(enterCommand).toHaveBeenCalledTimes(1);
  // The base keymap binding for Enter split the paragraph in two.
  expect(testEditor.doc.childCount).toBe(2);
});
