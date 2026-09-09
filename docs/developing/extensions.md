# Extension API

This page documents the classes and helpers you use to build an extension. For the concepts behind them — unist vs. ProseMirror, and the two translation directions — read the [Overview](/developing/overview) first.

All the generic parameters below are only relevant when using TypeScript. Both `SyntaxExtension` subclasses share two:

- **`UNode extends UnistNode`** — the unist node type the extension handles.
- **`UnistToProseMirrorContext extends Record<string, unknown>`** — the type of the global translation context the extension expects. Defaults to `Record<string, unknown>`.

## `Extension`

The root class for all prosemirror-unified extensions. By itself it does little; you normally extend `NodeExtension` or `MarkExtension` instead.

### `dependencies(): Array<Extension>`

Override this to declare other extensions that must be present for this one to work. For example, a list extension can declare a list-item extension as a dependency, and the `MarkdownExtension` from prosemirror-remark uses this to pull in all the individual markdown extensions. Defaults to `[]`.

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

### `abstract unistNodeName(): UNode["type"]`

Returns the unist node type this extension translates.

### `unistToProseMirrorTest(node: UnistNode): boolean`

Checks whether the extension can translate a given unist node. By default compares the node type against `unistNodeName()`.

When several extensions handle different variants of the same unist node type, their implementations must be mutually exclusive so only one ever matches. For example, ordered- and unordered-list extensions can both handle the unist `list` node, one testing `ordered === true` and the other `ordered !== true`.

### `abstract unistNodeToProseMirrorNodes(node: UNode, schema: Schema<string, string>, convertedChildren: Array<ProseMirrorNode>, context: Partial<UnistToProseMirrorContext>): Array<ProseMirrorNode>`

Translates a unist node to ProseMirror. Receives the original unist node, the built schema, the already-translated children, and the mutable global context. Returns an array of ProseMirror nodes (usually one, but you may produce several).

### `postUnistToProseMirrorHook(context: Partial<UnistToProseMirrorContext>): void`

Called after the whole document has been translated from unist to ProseMirror. Does nothing by default.

### `proseMirrorInputRules(proseMirrorSchema: Schema<string, string>): Array<InputRule>`

Override to add input rules to the editor. Receives the built schema. Defaults to `[]`. See [`MarkInputRule`](#markinputrule) for mark-adding rules.

### `proseMirrorKeymap(proseMirrorSchema: Schema<string, string>): Record<string, Command>`

Override to add keyboard shortcuts, keyed by shortcut. Receives the built schema. Defaults to `{}`.

## `NodeExtension`

Abstract class extending `SyntaxExtension`. Extend this to support a unist node that maps to a ProseMirror **node**.

### `abstract proseMirrorNodeName(): string | null`

Returns the ProseMirror node type this extension produces, or `null` if it produces none. No two extensions may return the same name — doing so throws when the schema is built.

### `abstract proseMirrorNodeSpec(): NodeSpec | null`

Returns the ProseMirror node spec, or `null` if the extension produces no node.

### `abstract proseMirrorNodeToUnistNodes(node: ProseMirrorNode, convertedChildren: Array<UnistNode>): Array<UNode>`

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

### `abstract processConvertedUnistNode(convertedNode: UnistNode, originalMark: Mark): UNode`

Called when serializing from ProseMirror to unist. The ProseMirror node has already been translated by a `NodeExtension`; this method receives the resulting unist node together with the mark that was on the original ProseMirror node, and post-processes the unist node for that mark. It is called once per matching mark, and the node passed in may already have been post-processed by other marks' extensions.

## `MarkInputRule`

Extends ProseMirror's `InputRule`, for input rules that add marks.

### `constructor(matcher: RegExp, markType: MarkType)`

Creates a rule that applies `markType` when input matches `matcher`. The `matcher` must end with `$` and contain two named capturing groups:

- **`content`** — the text the mark is applied to. The whole match is replaced by this group, which is how the surrounding delimiters (e.g. the asterisks around bold text) get removed.
- **`trailing`** — the text typed after the closing delimiter, re-inserted verbatim after the mark is applied. May be longer than one character. A `trailing` match of a single newline is not re-inserted, since the newline is handled outside the text node.

The `trailing` group may be made optional, so the rule also fires when nothing follows the closing delimiter — the rule then triggers as soon as the delimiter is typed:

```ts
new MarkInputRule(/<b>(?<content>.*)<\/b>(?<trailing>.)?$/u, schema.marks["bold"]);
```

A rule that never has trailing text can use an empty group:

```ts
new MarkInputRule(/<b>(?<content>.*)<\/b>(?<trailing>)?$/u, schema.marks["bold"]);
```

Requiring trailing text is what lets a matcher with a variable-length delimiter resolve that delimiter unambiguously, so making `trailing` optional is only appropriate for marks with a fixed delimiter. Any other capturing groups are ignored and may be used freely.

## `createProseMirrorNode(nodeName: string | null, schema: Schema<string, string>, children: Array<ProseMirrorNode>, attrs: Attrs = {})`

Helper that creates a ProseMirror node named `nodeName` with the given children and attributes, returning `[]` if `nodeName` is `null`. Useful when writing a `NodeExtension`.
