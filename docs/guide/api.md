# `ProseMirrorUnified` API

`ProseMirrorUnified` is the adapter between ProseMirror and unified — the one class you interact with when using the package. You construct it with a list of extensions and then use it to build the schema, parse and serialize documents, and produce the ProseMirror plugins and node views. If you are writing your own extensions instead, see [Developing extensions](/developing/overview).

## Types

The signatures below refer to a few types by name:

| Type                  | Where it comes from                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Extension`           | prosemirror-unified — the base class every extension extends.                                                                         |
| `ProseMirrorNode`     | [`Node`](https://prosemirror.net/docs/ref/#model.Node) from [prosemirror-model](https://prosemirror.net/docs/ref/#model).             |
| `Schema`              | [prosemirror-model](https://prosemirror.net/docs/ref/#model.Schema), parameterised as `Schema<string, string>` (node and mark names). |
| `Plugin`              | [prosemirror-state](https://prosemirror.net/docs/ref/#state.Plugin).                                                                  |
| `NodeViewConstructor` | [prosemirror-view](https://prosemirror.net/docs/ref/#view.NodeViewConstructor).                                                       |

## `constructor(extensions: Array<Extension> = [])`

Creates the adapter from a list of extensions. The list is flat — extensions pull in their own dependencies — so for markdown you pass a single `MarkdownExtension`:

```ts
const pmu = new ProseMirrorUnified([new MarkdownExtension()]);
```

Every ProseMirror node and mark in the schema must be provided by **exactly one** extension. If two extensions return the same name from `proseMirrorNodeName()` or `proseMirrorMarkName()`, there would be no way to tell which spec to use, so the constructor throws.

## `parse(source: string): ProseMirrorNode`

Parses a source string with unified — markdown, when using prosemirror-remark — and returns the root node of the resulting ProseMirror document. This is how you set the editor's contents, most notably when initialising it.

## `serialize(doc: ProseMirrorNode): string`

The inverse of `parse`: serialises a ProseMirror node and all its children back to a source string. Use it to get the contents out of the editor, for example to save them.

## `schema(): Schema<string, string>`

Returns the ProseMirror schema to use for the editor. It is built to support every node and mark contributed by the extensions you passed in.

## `plugins(): Array<Plugin>`

Returns every ProseMirror plugin the adapter provides, in this order:

1. `inputRulesPlugin()`
2. `keymapPlugin()`
3. `extensionPlugins()`
4. `pastePlugin()`
5. the [base keymap](https://prosemirror.net/docs/ref/#commands.baseKeymap) from prosemirror-commands, which binds keys such as Enter, Backspace and Mod-a

This is the recommended way to set up the editor: pass the result to `EditorState.create`, and plugins added by new extensions or new versions are picked up without changing the setup. Your own plugins can go before or after them, but a keymap of your own has to go before them, as explained below:

```ts
EditorState.create({
  doc: pmu.parse(source),
  plugins: [
    keymap({ "Mod-z": undo, "Mod-y": redo }),
    ...pmu.plugins(),
    history(),
  ],
  schema: pmu.schema(),
});
```

The base keymap comes last because it handles keys such as Enter and Backspace, which would then never reach the plugins after it. A keymap of your own should therefore go before `pmu.plugins()`, where it takes precedence over everything the adapter provides, including the extensions' shortcuts and input rules that trigger on Enter. If it should only handle what those leave, build the list yourself as shown below and put your keymap before the base keymap.

Every call returns the same plugin instances, shared by every editor built from the same `ProseMirrorUnified`, so reconfiguring a state with [`EditorState.reconfigure`](https://prosemirror.net/docs/ref/#state.EditorState.reconfigure) and another `plugins()` call keeps the plugins' state.

If you need a different selection or order, for example to leave out the paste plugin, build the list yourself from the individual methods below. Use them instead of `plugins()`, not alongside it: since they return the same instances, a plugin would be added twice, which `EditorState` rejects with a `RangeError`. None of them includes the base keymap, so add it yourself, last — without it, keys such as Enter and Backspace do nothing:

```ts
import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

EditorState.create({
  doc: pmu.parse(source),
  plugins: [
    pmu.inputRulesPlugin(),
    pmu.keymapPlugin(),
    ...pmu.extensionPlugins(),
    keymap(baseKeymap),
  ],
  schema: pmu.schema(),
});
```

## `inputRulesPlugin(): Plugin`

Returns a ProseMirror plugin containing every extension's input rules. Input rules govern how ProseMirror replaces what a user types with structured content — for markdown, typing `**text**` becomes bold text. This lets users type markdown while still getting a real ProseMirror document.

The rules also run when Enter is pressed without a modifier key, as if a line ending had been typed. Enter then goes on to the keymaps as usual, unless the rule that applied is an [`EnterInputRule`](/developing/extensions#enterinputrule), which replaces what Enter does.

## `keymapPlugin(): Plugin`

Returns a ProseMirror plugin containing every extension's keyboard shortcuts — for example Ctrl-b for bold. When several extensions bind the same key, their commands are tried in extension order until one handles it. The prosemirror-commands base keymap isn't included: `plugins()` adds it, and if you don't use `plugins()`, add it yourself after this plugin.

## `pastePlugin(): Plugin`

Returns a ProseMirror plugin that parses pasted plain text the same way as `parse`, instead of inserting it as it is. The same applies to plain text dropped into the editor. Pasted content is merged into the surrounding content where possible — a single pasted line becomes part of the current paragraph — and keeps the marks at the cursor, such as bold.

Some cases are left to ProseMirror's default behaviour, which inserts the text as it is with one paragraph per line:

- Pasting as plain text (Ctrl-Shift-V), which gives users a way to paste source syntax literally. There is no equivalent for drag and drop.
- Pasting into a code block.
- Pasting several lines into a mark whose spec sets `code: true`, such as inline code. A single line pasted into such a mark isn't parsed either, but inserted as it is, keeping the marks at the cursor.
- Pasting only whitespace.
- Pasting text that cannot be parsed into a document.

Unlike with `parse`, inline content that no extension can convert isn't dropped: its source text is kept as plain text instead. If that isn't possible, for example for a whole unsupported block, the pasted text is inserted as it is.

Use ProseMirror's [`transformPastedText`](https://prosemirror.net/docs/ref/#view.EditorProps.transformPastedText) prop if you need to adjust the text before it is parsed.

## `extensionPlugins(): Array<Plugin>`

Returns the plugins contributed by the extensions through [`proseMirrorPlugins`](/developing/extensions#prosemirrorplugins-prosemirrorschema-schema-string-string-array-plugin), in the order described there.

## `nodeViews(): Record<string, NodeViewConstructor>`

Returns the node views registered by all the extensions, keyed by node name. Node views back richer, often interactive elements in the editor, such as clickable task lists. Pass the result to your `EditorView`.
