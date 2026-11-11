# Extension API

This page documents the classes and helpers you use to build an extension. For the concepts behind them — unist vs. ProseMirror, and the two translation directions — read the [Overview](/developing/overview) first.

## Types

The signatures below are written in TypeScript and refer to a handful of types by name. Most come from ProseMirror, unist and unified; this package renames two of them to avoid a name clash. Here is where each one comes from:

| Type                                                          | Where it comes from                                                                                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProseMirrorNode`                                             | [`Node`](https://prosemirror.net/docs/ref/#model.Node) from [prosemirror-model](https://prosemirror.net/docs/ref/#model) — aliased so it doesn't clash with unist's `Node`. |
| `UnistNode`                                                   | [`Node`](https://github.com/syntax-tree/unist#node) from [unist](https://github.com/syntax-tree/unist) — likewise aliased.                                                  |
| `Schema`, `Mark`, `MarkType`, `Attrs`, `NodeSpec`, `MarkSpec` | [prosemirror-model](https://prosemirror.net/docs/ref/#model). `Schema` is parameterised as `Schema<string, string>` (its node and mark names).                              |
| `NodeViewConstructor`                                         | [prosemirror-view](https://prosemirror.net/docs/ref/#view.NodeViewConstructor).                                                                                             |
| `InputRule`                                                   | [prosemirror-inputrules](https://prosemirror.net/docs/ref/#inputrules.InputRule).                                                                                           |
| `Command`, `Plugin`, `EditorState`, `Transaction`             | [prosemirror-state](https://prosemirror.net/docs/ref/#state).                                                                                                               |
| `Processor`                                                   | [unified](https://github.com/unifiedjs/unified#processor).                                                                                                                  |

Two more names are generic parameters of the extension classes rather than imported types — they stand for whatever types your own extension works with, and are only relevant when using TypeScript. Both `SyntaxExtension` subclasses share them:

- **`HandledUnistNode extends UnistNode`** — the unist node type your extension handles.
- **`UnistToProseMirrorContext extends Record<string, unknown>`** — the type of the global translation context your extension expects. Defaults to `Record<string, unknown>`.

## When the editor hooks are called

The hooks that contribute to the editor — `proseMirrorPlugins`, `proseMirrorInputRules`, `proseMirrorKeymap` and `proseMirrorNodeView` — are called once, the first time the corresponding part is requested from `ProseMirrorUnified`, not when it is constructed. Apps that only parse and serialize never call them. If one of them throws, every hook of that kind is called again on the next request.

## `Extension`

The root class for all prosemirror-unified extensions. By itself it does little; you normally extend `NodeExtension` or `MarkExtension` instead.

### `dependencies(): Array<Extension>`

Override this to declare other extensions that must be present for this one to work. For example, a list extension can declare a list-item extension as a dependency, and the `MarkdownExtension` from prosemirror-remark uses this to pull in all the individual markdown extensions. Defaults to `[]`.

### `proseMirrorPlugins(proseMirrorSchema: Schema<string, string>): Array<Plugin>`

Override to add ProseMirror plugins to the editor, for anything input rules, keymaps and node views can't do, such as plugin state, decorations, `appendTransaction` or other editor props. Receives the built schema. Defaults to `[]`.

Apps can assemble their plugins without the extensions' ones, so the editor should still work without them, if more plainly. An extension added several times, for example as a dependency of two other extensions, contributes its plugins once. That makes it safe to give a plugin a [`PluginKey`](https://prosemirror.net/docs/ref/#state.PluginKey), which `EditorState` only allows once; create the key outside the hook, so that other code can use it to read the plugin's state:

```ts
import { Plugin, PluginKey } from "prosemirror-state";
import { Extension } from "prosemirror-unified";

export const wordCountKey = new PluginKey<number>("wordCount");

class WordCountExtension extends Extension {
  public proseMirrorPlugins(): Array<Plugin> {
    return [
      new Plugin<number>({
        key: wordCountKey,
        state: {
          init: (_, state): number => countWords(state.doc),
          apply: (tr, count): number =>
            tr.docChanged ? countWords(tr.doc) : count,
        },
      }),
    ];
  }
}
```

The returned plugins are shared by every editor built from the same `ProseMirrorUnified`. Keep anything that differs between editors in the plugin's [`state`](https://prosemirror.net/docs/ref/#state.PluginSpec.state) or [`view`](https://prosemirror.net/docs/ref/#state.PluginSpec.view), not in variables the hook captures, which every editor would share.

The plugins of node extensions come first, then those of mark extensions, then the others. Within each group, extensions are in the order they were added, with each extension's dependencies before it; a dependency from a different group follows its own group instead. In [`plugins()`](/guide/api#plugins-array-plugin), they come after the input rules and the extensions' keyboard shortcuts, and before the paste plugin and the base keymap. So keys that an extension handles should usually go in `proseMirrorKeymap` instead of a plugin's `handleKeyDown`, where every extension's shortcuts would take them first. A plugin that handles pasting, through props such as `handlePaste` or `clipboardTextParser`, takes precedence over the paste plugin.

### `unifiedInitializationHook(processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>`

Called when the unified instance is created, so the extension can register unified plugins. To add remark, for example:

```ts
import { Extension } from "prosemirror-unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

class MarkdownExtension extends Extension {
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkParse).use(remarkStringify);
  }
}
```

By default returns the `processor` unchanged.

## `SyntaxExtension`

Abstract class extending `Extension`. You should rarely extend it directly — it holds the machinery shared by `NodeExtension` and `MarkExtension`.

### `abstract unistNodeName(): HandledUnistNode["type"]`

Returns the unist node type this extension translates.

### `unistToProseMirrorTest(node: UnistNode): boolean`

Checks whether the extension can translate a given unist node. By default compares the node type against `unistNodeName()`.

When several extensions handle different variants of the same unist node type, their implementations must be mutually exclusive so only one ever matches. For example, ordered- and unordered-list extensions can both handle the unist `list` node, one testing `ordered === true` and the other `ordered !== true`.

### `abstract unistNodeToProseMirrorNodes(node: HandledUnistNode, schema: Schema<string, string>, convertedChildren: Array<ProseMirrorNode>, context: Partial<UnistToProseMirrorContext>): Array<ProseMirrorNode>`

Translates a unist node to ProseMirror. Receives the original unist node, the built schema, the already-translated children, and the mutable global context. Returns an array of ProseMirror nodes (usually one, but you may produce several).

### `postUnistToProseMirrorHook(context: Partial<UnistToProseMirrorContext>): void`

Called after the whole document has been translated from unist to ProseMirror. Does nothing by default.

### `proseMirrorInputRules(proseMirrorSchema: Schema<string, string>): Array<InputRule>`

Override to add input rules to the editor. Receives the built schema. Defaults to `[]`. See [`MarkInputRule`](#markinputrule) for mark-adding rules and [`EnterInputRule`](#enterinputrule) for rules that replace what Enter does.

The rules also run when Enter is pressed without a modifier key and the selection is within a single textblock: they are matched as if a line ending (`"\n"`) had been typed, so a rule ending in e.g. `\s$` applies on Enter too. To keep a rule from applying on Enter, don't let its last character match `\n`. After a rule applies, Enter goes on to the keymaps, which split the block or do whatever else Enter is bound to — unless the rule is an `EnterInputRule`. As the line ending isn't in the document, it isn't inserted as text: a `"\n"` that the rule inserts right before the cursor, for example through a string handler with a capture group, is removed again.

### `proseMirrorKeymap(proseMirrorSchema: Schema<string, string>): Record<string, Command>`

Override to add keyboard shortcuts, keyed by shortcut. Receives the built schema. Defaults to `{}`.

## `NodeExtension`

Abstract class extending `SyntaxExtension`. Extend this to support a unist node that maps to a ProseMirror **node**.

### `abstract proseMirrorNodeName(): string | null`

Returns the ProseMirror node type this extension produces, or `null` if it produces none. No two extensions may return the same name — doing so throws when the schema is built.

### `abstract proseMirrorNodeSpec(): NodeSpec | null`

Returns the ProseMirror node spec, or `null` if the extension produces no node.

### `abstract proseMirrorNodeToUnistNodes(node: ProseMirrorNode, convertedChildren: Array<UnistNode>): Array<HandledUnistNode>`

Translates a ProseMirror node to unist. Receives the original node and its already-translated children. Returns an array of unist nodes (usually one).

### `proseMirrorToUnistTest(node: ProseMirrorNode): boolean`

Checks whether the extension can translate a given ProseMirror node. By default compares the node name against `proseMirrorNodeName()`. As with `unistToProseMirrorTest`, only one extension should match a given node.

### `proseMirrorNodeView(): NodeViewConstructor | null`

Returns a node-view constructor for this extension's node, or `null`. Node views provide richer, often interactive elements such as clickable task lists. Defaults to `null`.

## `MarkExtension`

Abstract class extending `SyntaxExtension`. Extend this to support a unist node that maps to a ProseMirror **mark**.

### `abstract proseMirrorMarkName(): string | null`

Returns the ProseMirror mark type this extension handles, or `null` if it produces none. No two extensions may return the same name — doing so throws when the schema is built, or logs a warning during translation if only one of the two extensions provides a mark spec.

### `abstract proseMirrorMarkSpec(): MarkSpec | null`

Returns the ProseMirror mark spec, or `null` if the extension produces no mark.

### `abstract processConvertedUnistNodes(convertedNodes: Array<UnistNode>, originalMark: Mark): UnistNode`

Called when serializing from ProseMirror to unist. Receives the unist nodes carrying the mark together with the mark itself, and returns a single unist node wrapping them. Neighbouring ProseMirror nodes sharing an equal mark are passed together in one call, so a mark spanning several ProseMirror nodes produces a single unist node. The nodes passed in may already be wrapped by other marks: where marks overlap, the mark covering the most neighbouring nodes goes outermost, and on a tie, the mark that comes first in the schema does.

The returned node is usually of the extension's own unist type, and an override may declare that narrower return type. It doesn't have to be, though: for example, a leaf mark that can't apply to the node it receives (such as inline code on an image) can return that node unchanged.

### `unistNodeIsLeaf(): boolean`

Whether the unist node this mark converts to is a leaf (for example an mdast `inlineCode`), which can't contain the unist nodes produced by other marks. Leaf marks are applied first, regardless of their rank in the schema, so their `processConvertedUnistNodes` always receives exactly one node, the one produced by the `NodeExtension`, and leaf marks are never grouped across neighbouring nodes. A ProseMirror node can't be converted with more than one leaf mark — only the first one is applied and the others are dropped with a warning. Defaults to `false`.

## `MarkInputRule`

Extends ProseMirror's `InputRule`, for input rules that add marks.

### `constructor(matcher: RegExp, markType: MarkType, options: MarkInputRuleOptions = {})`

Creates a rule that applies `markType` when input matches `matcher`. The `matcher` must consist of exactly four named capturing groups, in this order, followed by `$`, with nothing else outside them — no text, quantifiers or other groups — and must not have the `g`, `m` or `y` flag. The constructor throws otherwise.

- **`opening`** — the opening delimiter (e.g. the asterisks before bold text). It is removed.
- **`content`** — the text the mark is applied to. The mark is added to it in place, so marks already on the content are kept, except those the new mark excludes (see the `excludes` property of its mark spec). These are removed, the same as when the mark is added in any other way.
- **`closing`** — the closing delimiter. It is removed.
- **`trailing`** — the text after the closing delimiter. May be longer than one character. Any part of it already in the document is kept as it is, and the typed rest is inserted after the mark is applied, without the mark. If the typed rest is a single newline, it is not inserted, since the newline is handled outside the text node.

Everything else goes inside the groups. Conditions on the text before the opening delimiter are lookbehinds inside `opening`, so they don't consume (and remove) that text, and a delimiter defined through a backreference is a group nested in `opening`:

```ts
new MarkInputRule(
  /(?<opening>(?<=^|[\s\uFFFC])(?<delimiter>`+))(?<content>[^`]+)(?<closing>\k<delimiter>)(?<trailing>.)$/u,
  schema.marks["code"],
);
```

The lookbehind accepts U+FFFC too, which stands in for inline leaf nodes (see below), so that the rule also applies right after a leaf node.

The `opening`, `closing` and `trailing` groups may be empty (the rule never applies to empty `content`), but optionality must be expressed inside a group — `(?<trailing>.?)`, not `(?<trailing>.)?`. If `closing` and `trailing` can both be empty, though, the rule applies as soon as any `content` is typed, so a matcher should not leave both of them empty. An optional `trailing` group lets the rule also fire when nothing follows the closing delimiter — the rule then triggers as soon as the delimiter is typed:

```ts
new MarkInputRule(
  /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.?)$/u,
  schema.marks["bold"],
);
```

A rule that never has trailing text can use an empty group, `(?<trailing>)`.

Requiring trailing text is what lets a matcher with a variable-length delimiter resolve that delimiter unambiguously, so making `trailing` optional is only appropriate for marks with a fixed delimiter. Groups nested inside the four named ones are ignored and may be used freely.

ProseMirror matches input rules against the text before the cursor with every inline leaf node (an image, a hard break) replaced by U+FFFC, the Unicode "object replacement character", which stands in for an embedded object that has no text of its own. So a `content` group such as `.*` or `\S+` also matches across leaf nodes. By default, the rule doesn't apply when `content` contains U+FFFC. Set `allowLeafNodes` to `true` for marks that may contain leaf nodes (e.g. bold); the leaf nodes are then kept and get the mark too. Leave it `false` for marks whose unist node can't contain them (e.g. inline code). Regardless of `allowLeafNodes`, the rule never applies when `opening` or `closing` contains U+FFFC, nor when `content` is empty. Leaf nodes in `trailing` are kept.

The rule also doesn't apply when the mark can't be added to all of the content, e.g. because part of it has a mark that excludes this one.

`options` takes:

- **`allowLeafNodes`** — see above. Defaults to `false`.
- **`inCode`**, **`inCodeMark`**, **`undoable`** — passed through to ProseMirror's [`InputRule`](https://prosemirror.net/docs/ref/#inputrules.InputRule.constructor). For example, a rule for inline code can set `inCodeMark: false` so it doesn't fire inside text that already has the code mark.

## `EnterInputRule`

Extends ProseMirror's `InputRule`, for input rules that replace what Enter does — for example turning a code fence line into a code block, or `[ ]` at the start of a list item into a checkbox. A plain input rule that applies on Enter is followed by the usual Enter handling, so the block would be split after the rule's change. When an `EnterInputRule` applies on Enter, the key isn't handled any further.

### `constructor(matcher: RegExp, handler: EnterInputRuleHandler, options?: EnterInputRuleOptions)`

Takes the same arguments as ProseMirror's [`InputRule`](https://prosemirror.net/docs/ref/#inputrules.InputRule.constructor), except that `handler` must be a function — `(state: EditorState, match: RegExpMatchArray, start: number, end: number) => Transaction | null` — not a string (a string throws a `TypeError`). `options` (`inCode`, `inCodeMark`, `undoable`) is passed through to `InputRule`.

On Enter, the text the matcher sees ends with `"\n"`, which isn't in the document, so `end` is the cursor position, or the end of the selection if there is one. The rule only replaces Enter when the handler returns a transaction; when it returns `null`, Enter is handled as usual. On Enter, `EnterInputRule`s are tried before all other input rules, regardless of the order of the extensions, so a rule that replaces Enter wins over one that only reacts to it. Text input other than Enter is handled exactly as by a plain `InputRule`, without any effect on later key presses:

````ts
new EnterInputRule(/^```(?<lang>\w*)\n$/u, (state, match, start, end) => {
  const codeBlock = state.schema.nodes["code_block"];
  if (codeBlock === undefined) {
    // Enter is handled as usual
    return null;
  }
  return state.tr
    .delete(start, end)
    .setBlockType(start, start, codeBlock, { lang: match.groups?.["lang"] });
});
````

When the rule is undoable, [`undoInputRule`](https://prosemirror.net/docs/ref/#inputrules.undoInputRule) right after it reverts the rule's change without inserting a line ending.

## `createProseMirrorNode(nodeName: string | null, schema: Schema<string, string>, children: Array<ProseMirrorNode>, attrs: Attrs = {})`

Helper that creates a ProseMirror node named `nodeName` with the given children and attributes, returning `[]` if `nodeName` is `null`. Useful when writing a `NodeExtension`.
