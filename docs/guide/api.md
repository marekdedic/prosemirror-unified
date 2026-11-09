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

ProseMirror tries plugins in order, so this order decides who handles a key or a paste:

- The base keymap comes last because it handles keys such as Enter and Backspace, which would then never reach the plugins after it. A keymap of your own should therefore go before `pmu.plugins()`, or it won't get those keys. There, it takes precedence over everything the adapter provides, including the extensions' shortcuts and input rules that trigger on Enter. If it should only handle what those leave, build the list yourself as shown below and put your keymap before the base keymap.
- The extensions' keyboard shortcuts come before their plugins, so a shortcut an extension binds isn't taken by another extension's plugin.
- The extensions' plugins come before the paste plugin, so an extension plugin that handles pasting, through props such as [`handlePaste`](https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste) or [`clipboardTextParser`](https://prosemirror.net/docs/ref/#view.EditorProps.clipboardTextParser), takes precedence over it.

Every plugin is built the first time it is requested, and every call after that returns the same instance — from `plugins()` as well as from the individual methods below. ProseMirror keeps a plugin's state in each `EditorState`, so one instance can serve any number of editors, and these instances are shared by every editor built from the same `ProseMirrorUnified`. Keeping the same instances also matters for [`EditorState.reconfigure`](https://prosemirror.net/docs/ref/#state.EditorState.reconfigure), which only keeps a plugin's state when the plugin is the same instance: reconfiguring with the result of another `plugins()` call keeps, for example, the input rule that Backspace would undo. `plugins()` and `extensionPlugins()` return a new array on each call, so changing it doesn't affect later calls.

Because they are built on first use, the extensions' input rules, keyboard shortcuts and plugins are only collected when a plugin method is first called, and the same goes for `nodeViews()`. An app that only uses `parse` and `serialize`, for example on a server without a DOM, never runs those extension hooks, and an error thrown by one shows up on the first call of the corresponding method rather than in the constructor. Nothing is kept from a call that throws, so the next call runs the hooks again.

If you need a different selection or order, for example to leave out the paste plugin, build the list yourself from the individual methods below. Use them instead of `plugins()`, not alongside it: since they return the same instances, a plugin would be added twice, which `EditorState` rejects with a `RangeError`. None of them includes the base keymap, so add it yourself, last, with `keymap(baseKeymap)` from [prosemirror-keymap](https://prosemirror.net/docs/ref/#keymap) and [prosemirror-commands](https://prosemirror.net/docs/ref/#commands). Without it, keys such as Enter and Backspace do nothing:

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

## `keymapPlugin(): Plugin`

Returns a ProseMirror plugin containing every extension's keyboard shortcuts — for example Ctrl-b for bold. When several extensions bind the same key, their commands are tried in extension order until one handles it. The prosemirror-commands base keymap isn't included: `plugins()` adds it, and if you don't use `plugins()`, add it yourself after this plugin.

## `pastePlugin(): Plugin`

Returns a ProseMirror plugin that parses pasted text the same way as `parse`, instead of inserting it as it is. It only applies when the clipboard holds nothing but plain text; otherwise, ProseMirror handles the paste as usual. The same applies to plain text dropped into the editor by drag and drop. A single trailing line break is dropped, and pasted content is merged into the surrounding content where possible — a single pasted line becomes part of the current paragraph rather than a new one. As with ProseMirror's default plain text paste, the pasted content keeps the marks at the cursor, such as bold, wherever they are allowed and don't conflict with the pasted content's own marks.

Some cases are left to ProseMirror's default behaviour, which inserts the text as it is with one paragraph per line:

- Pasting as plain text (Ctrl-Shift-V), which gives users a way to paste source syntax literally. There is no equivalent for drag and drop.
- Pasting into a code block.
- Pasting only whitespace.
- Pasting text that cannot be parsed into a document, including the case described below.

Unlike with `parse`, content that no extension can convert isn't dropped: its source text is kept as plain text instead. This needs the parser to record the position of each node in the source; content without a position is dropped with a warning, the same as with `parse`. If the text can't be kept faithfully, because it spans multiple lines, or can't be placed where the content was, because the content isn't inline (e.g. a whole unsupported block), the whole pasted text is inserted as it is.

Use ProseMirror's [`transformPastedText`](https://prosemirror.net/docs/ref/#view.EditorProps.transformPastedText) prop if you need to adjust the text before it is parsed.

## `extensionPlugins(): Array<Plugin>`

Returns the plugins contributed by the extensions through [`proseMirrorPlugins`](/developing/extensions#prosemirrorplugins-prosemirrorschema-schema-string-string-array-plugin): node extensions first, then mark extensions, then the others. Within each group, extensions are in the order they were added, with each extension's dependencies before it. A dependency from a different group follows its own group instead: a plain `Extension` that a node extension depends on comes after all node and mark extensions. An extension that is pulled in several times, for example as a dependency of two others, contributes its plugins once. Calling `extensionPlugins()` repeatedly returns the same plugin instances, in a new array each time.

## `nodeViews(): Record<string, NodeViewConstructor>`

Returns the node views registered by all the extensions, keyed by node name. Node views back richer, often interactive elements in the editor, such as clickable task lists. Pass the result to your `EditorView`. The node views are collected the first time `nodeViews()` is called, and every call returns the same object.
