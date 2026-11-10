import type { Command } from "prosemirror-state";

import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { expect, test, vi } from "vitest";
import { type ProseMirrorEditor, renderProseMirror } from "vitest-prosemirror";

import { buildKeymapPlugin } from "../../src/buildKeymapPlugin";
import { ExtensionManager } from "../../src/ExtensionManager";
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
): ProseMirrorEditor => {
  const first = new FirstExtension();
  first.proseMirrorKeymap.mockReturnValue(keymaps[0]);
  const second = new SecondExtension();
  second.proseMirrorKeymap.mockReturnValue(keymaps[1]);

  const plugin = buildKeymapPlugin(
    new ExtensionManager([first, second]),
    schema,
  );
  const testEditor = renderProseMirror(
    schema.nodes["doc"].create(null, schema.nodes["paragraph"].create()),
    { editorProps: { plugins: [plugin] } },
  );

  testEditor.setSelection("end");
  testEditor.type(key);

  return testEditor;
};

test("buildKeymapPlugin chains commands bound to the same key", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => false);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-b": secondCommand }], "{Mod-b}");

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).toHaveBeenCalledTimes(1);
});

test("buildKeymapPlugin stops chaining once a command succeeds", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => true);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-b": secondCommand }], "{Mod-b}");

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).not.toHaveBeenCalled();
});

test("buildKeymapPlugin keeps commands bound to different keys apart", () => {
  expect.assertions(2);

  const firstCommand = vi.fn<Command>(() => true);
  const secondCommand = vi.fn<Command>(() => true);

  pressKey([{ "Mod-b": firstCommand }, { "Mod-i": secondCommand }], "{Mod-b}");

  expect(firstCommand).toHaveBeenCalledTimes(1);
  expect(secondCommand).not.toHaveBeenCalled();
});

test("buildKeymapPlugin leaves out the base keymap", () => {
  expect.assertions(2);

  const enterCommand = vi.fn<Command>(() => false);

  const testEditor = pressKey([{ Enter: enterCommand }, {}], "{Enter}");

  expect(enterCommand).toHaveBeenCalledTimes(1);
  // Without the base keymap, nothing split the paragraph.
  expect(testEditor.doc.childCount).toBe(1);
});
