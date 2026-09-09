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

## `inputRulesPlugin(): Plugin`

Returns a ProseMirror plugin containing every extension's input rules. Input rules govern how ProseMirror replaces what a user types with structured content — for markdown, typing `**text**` becomes bold text. This lets users type markdown while still getting a real ProseMirror document.

## `keymapPlugin(): Plugin`

Returns a ProseMirror plugin containing every extension's keyboard shortcuts — for example Ctrl-b for bold — layered on top of the prosemirror-commands base keymap.

## `nodeViews(): Record<string, NodeViewConstructor>`

Returns the node views registered by all the extensions, keyed by node name. Node views back richer, often interactive elements in the editor, such as clickable task lists. Pass the result to your `EditorView`.
