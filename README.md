# prosemirror-unified

[![NPM Version](https://img.shields.io/npm/v/prosemirror-unified?logo=npm)](https://www.npmjs.com/package/prosemirror-unified)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-unified/CI.yml?branch=master&logo=github)](https://github.com/marekdedic/prosemirror-unified/actions/workflows/CI.yml)
[![Codecov (with branch)](https://img.shields.io/codecov/c/github/marekdedic/prosemirror-unified/master?logo=codecov)](https://app.codecov.io/gh/marekdedic/prosemirror-unified)
[![NPM Downloads](https://img.shields.io/npm/dm/prosemirror-unified?logo=npm)](https://www.npmjs.com/package/prosemirror-unified)
[![NPM License](https://img.shields.io/npm/l/prosemirror-unified)](https://github.com/marekdedic/prosemirror-unified/blob/master/LICENSE)

This package provides support for using the [unified](https://github.com/unifiedjs/unified) ecosystem of parsers and other packages (for example, [remark](https://github.com/remarkjs/remark), the markdown parser) in [ProseMirror](https://prosemirror.net/).

## Using prosemirror-unified with an existing extension

In the same way as unified provides a general framework for parsing and serializing that has to be extended to be used with a particular syntax (for example using remark to parse and serialize markdown), prosemirror-unified is a general package for connecting unified with ProseMirror that has to be extended to support a particular syntax (for example using prosemirror-remark to support markdown).

Currently, there is only the [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark) package to support markdown parsing and serialization. See the next section if you want to add support for other unified plugins.

### Example

```ts
import { MarkdownExtension } from "prosemirror-remark";
import { EditorState } from "prosemirror-state";
import { ProseMirrorUnified } from "prosemirror-unified";
import { EditorView } from "prosemirror-view";

const sourceMarkdown = "**Bold text**";
const pmu = new ProseMirrorUnified([new MarkdownExtension()]);

const view = new EditorView(
  // The element to use for the editor
  document.querySelector("#editor")!,
  {
    state: EditorState.create({
      // Set the initial content of the editor from sourceMarkdown
      doc: pmu.parse(sourceMarkdown),
      plugins: [pmu.inputRulesPlugin(), pmu.keymapPlugin()],
      schema: pmu.schema(),
    }),
    // Add interactive elements (task lists etc.)
    nodeViews: pmu.nodeViews(),
    // Log (in the browser console) the current content in markdown on every update
    dispatchTransaction: (tr): void => {
      view.updateState(view.state.apply(tr));
      console.log(pmu.serialize(view.state.doc));
    },
  }
);
```

### The `ProseMirrorUnified` class

This class represents the adapter between ProseMirror and unified. To use the package with existing extensions, you only need the `ProseMirrorUnified` class.

#### Methods

##### `constructor(extensions: Array<Extension>)`

The constructor of `ProseMirrorUnified` takes only one parameter, a list of prosemirror-unified extensions to use.

Every ProseMirror node and mark in the schema must be provided by exactly one extension. If two extensions return the same name from `proseMirrorNodeName()` or `proseMirrorMarkName()`, the constructor throws, as there would be no way to tell which of the two specs should be used.

##### `parse(source: string): ProseMirrorNode`

Parses a source from a string with unified (so, for example, the source would contain markdown when using with prosemirror-remark) and returns the root node of the ProseMirror AST. This is useful when trying to set the contents of the editor, most notably when initializing it - see the example above.

##### `serialize(doc: ProseMirrorNode): string`

Serializes a ProseMirror node (incl. all children) to a string, i.e., the inverse of `parse`. This is useful when you want to get the contents out of the editor, for example to save them.

##### `schema(): Schema<string, string>`

Returns the ProseMirror schema to use for the editor. This schema is constructed so that it supports all available extensions.

##### `inputRulesPlugin(): Plugin`

Input rules are rules that govern how ProseMirror replaces what users write with ProseMirror nodes - e.g. for markdown, when a user writes `**Some text**`, then after entering the last \*, the whole text would be replaced by a ProseMirror bold text. This allows users to write markdown, but still get the benefits of ProseMirror. The `inputRulesPlugin()` function returns a ProseMirror plugin that adds all extension input rules to the editor.

##### `keymapPlugin(): Plugin`

A ProseMirror keymap specifiec all the keyboard shortcuts users can use in the editor, for example Ctrl-b for bold text. This function returns a ProseMirror plugin that adds all extension keyboard shortcuts to the editor.

##### `nodeViews(): Record<string, NodeViewConstructor>`

A list of Node views to use in the prose mirror editor. Node views are a way to provide more complex and often interactive elements in the editor, such as clickable task lists. This function returns a list of ProseMirror node views registered by all available extensions.

## Creating your own extensions

prosemirror-unified provides several utilities for creating your own extension to support custom unified syntax. Please note that `prosemirror-unified` doesn't aim to extend unified itself, so you either need to take an existing unified plugin (such as remark for GitHub or rehype for HTML) or create your own. prosemirror-unified provides the tools to translate between the unified syntax (called unist) and the ProseMirror syntax.

Documents in unist are represented by an abstract syntax tree (AST) of nodes, starting with a root node representing the whole document. In ProseMirror, things work mostly the same way, with one important difference - ProseMirror has a concept of *marks* that can be applied to a node in the AST. These represent things such as bold text, which in ProseMirror is just a text node with a mark to make it bold. In unist, there are no marks and bold text is represented by a bold node, which contains a text node.

To make up for this difference, prosemirror-unified provides two basic types of extensions:

- A `NodeExtension` is used when translating between a unist node and a ProseMirror node - for example a paragraph. The extension provides functions to translate both ways.
- A `MarkExtension` is used to translate between a unist node and a ProseMirror mark - for example bold text. This type of extension also provides fnctions to translate both ways.

### Translating from unist to ProseMirror

prosemirror-unified traverses an existing unist AST and creates a matching ProseMirror AST from the leaf nodes to the root. For each node, all extensions are checked to find one that can translate this type of node. At most one extension should be applicable to any given node - if several extensions match, the first one is used and a warning is logged. Once an applicable extension is found, all the children of the node are translated first. Only after that is the actual node translated, so that it can use the already-prepared children and incorporate them in the ProseMirror tree. This process works the same for `NodeExtension`s and `MarkExtension`s as the extension can decide what the output node will look like and what marks it will have.

As some extensions need to add information after the whole document is parsed, there is a global context that any extension can modify when translating a node. Additionally, a post-translation hook can be added to any extension.

### Translating from ProseMirror to unist

prosemirror-unified traverses the existing ProseMirror AST and creates a matching unist AST from the leaf nodes to the root. For each node, all extensions are searched to find a `NodeExtension` that can translate this node. As when translating in the other direction, at most one `NodeExtension` should be applicable to any given node - if several match, the first one is used and a warning is logged. Once an applicable `NodeExtension` is found, all the children of the node are translated first. Only after that is the actual node translated, so that it can use the already-prepared children and incorporate then in the unist tree. If the original ProseMirror node had any marks, then for each mark a matching `MarkExtension` is found and that extension can post-process the already-translated unist node. As with nodes, at most one `MarkExtension` should handle any given mark - if several match, the first one is used and a warning is logged. A node carrying several marks is post-processed once per mark, each `MarkExtension` receiving the result of the previous one. For multiple marks, the order in which they are processes will is not guaranteed.

#### Example

Bold text is represented by a Text node with a Bold mark in ProseMirror. As such, when translating to unist, first a hypothetical `TextExtension` (which is a `NodeExtension`) is called, which translates the node into a unist Text node. This unist node is then post-processed by a `BoldExtension` (which is a `MarkExtension`) and changed into a unist Bold node (which contains the original unist Text node).

### The `Extension` class

This is the root class for all prosemirror-unified extensions. By itself, it cannot do much, except for two things.

#### Methods

##### `dependencies(): Array<Extension>`

By overriding the `dependencies` method, you can specify other extensions that must be present for this extension to work. One example where this can be useful is when creating an extension to handle lists of items, you can specify an extension which handles an individual list item as a dependency. Another example is the `MarkdownExtension` from the prosemirror-remark package, which is a wrapper for all the individual extensions that add various parts of the markdown syntax.

By default returns `[]`.

##### `unifiedInitializationHook(processor: Processor<UnistNode, UnistNode, UnistNode, string>): Processor<UnistNode, UnistNode, UnistNode, string>`

This method is called when creating the unified instance to add support for various unified plugins. For example, to add remark, you would override this method as

```ts
import { Extension } from "prosemirror-unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

class MarkdownExtension extends Extension {
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor
      .use(remarkParse)
      .use(remarkStringify);
  }
}
```

By default, returns the parameter `processor` as-is.

### The `SyntaxExtension` class

The abstract class `SyntaxExtension` extends the `Extension` class. You should probably never need to extend this class directly. However, as much of the functionality of `NodeExtension` and `MarkExtension` is shared, it is contained in the `SyntaxExtension` class.

#### Generic parameters

If you are using TypeScript, the `SyntaxExtension` class has two generic parameters that you need to specify.

##### `UNode extends UnistNode`

This specifies the unist node type that the extension handles.

##### `UnistToProseMirrorContext extends Record<string, unknown>`

This specifies the type of global context (shared across all extensions) that this extension expects. Default `Record<string, unknown>`.

#### Methods

##### `abstract unistNodeName(): UNode["type"]`

This method should return the type of the unist node this extension translates.

##### `unistToProseMirrorTest(node: UnistNode): boolean`

This method is used to check whether the extension can translate a given unist node to a ProseMirror node. By default, it checks whether the node type matches `this.unistNodeName()`.

When several extensions handle different variants of the same unist node type, their implementations of this method should be mutually exclusive, so that only one of them ever matches a given node. For example, an extension for ordered lists and an extension for unordered lists can both handle the unist `list` node, one testing for `ordered === true` and the other for `ordered !== true`.

##### `abstract unistNodeToProseMirrorNode(node: UNode, proseMirrorSchema: Schema<string, string>, convertedChildren: Array<ProseMirrorNode>, context: Partial<UnistToProseMirrorContext>): Array<ProseMirrorNode>`

This method handles the translation from a unist node to a ProseMirror node. It receives the original unist node, the built ProseMirror schema, the already-translated children and the global translation context that it can modify. It should return an array of ProseMirror nodes (usually only one, but you can theoretically convert one unist node into multiple ProseMirror nodes).

##### `postUnistToProseMirrorHook(context: Partial<UnistToProseMirrorContext>): void`

This method is called during translation from unist to ProseMirror after the whole document has been translated. By default does nothing.

##### `proseMirrorInputRules(proseMirrorSchema: Schema<string, string>): Array<InputRule>`

Override this method to add input rules to the ProseMirror editor. The built ProseMirror schema is provided as a parameter.

By default returns `[]`.

##### `proseMirrorKeymap(proseMirrorSchema: Schema<string, string>): Record<string, Command>`

Override this method to add keyboard shortcuts to the ProseMirror editor. Returns an object where the keys are keyboard shortcuts and values are commands to run. The built ProseMirror schema is provided as a parameter.

By default returns `{}`.

### The `NodeExtension` class

The abstract class `NodeExtension` extends the `SyntaxExtension` class. You should extend this class to provide support for custom nodes.

#### Generic parameters

If you are using TypeScript, the `NodeExtension` class has two generic parameters that you need to specify.

##### `UNode extends UnistNode`

This specifies the unist node type that the extension handles.

##### `UnistToProseMirrorContext extends Record<string, unknown>`

This specifies the type of global context (shared across all extensions) that this extension expects. Default `Record<string, unknown>`.

#### Methods

##### `proseMirrorToUnistTest(node: ProseMirrorNode): boolean`

This method is used to check whether the extension can translate a given ProseMirror node to a unist node. By default, it checks whether the node name matches `this.proseMirrorNodeName()`. As with `unistToProseMirrorTest`, only one extension should ever match a given node.

##### `proseMirrorNodeView(): NodeViewConstructor | null`

This method should return a constructor of a node view associated with the ProseMirror node this extension translates or `null` if it doesn't provide one. By default, it returns `null`.

##### `abstract proseMirrorNodeName(): string | null`

This method should return the type of the ProseMirror node this extension translates or `null` if it doesn't produce any ProseMirror nodes. No two extensions may return the same name - doing so throws when the schema is built.

##### `abstract proseMirrorNodeSpec(): NodeSpec | null`

This method should return a ProseMirror node spec for the ProseMirror node it produces or `null` if it doesn't produce any ProseMirror nodes.

##### `abstract proseMirrorNodeToUnistNodes(node: ProseMirrorNode, convertedChildren: Array<UnistNode>): Array<UNode>`

This method handles the translation from a ProseMirror node to a unist node. It receives the original ProseMirror node and the already-translated children. It should return an array of unist nodes (usually only one, but you can theoretically convert one ProseMirror node into multiple unist nodes).

### The `MarkExtension` class

The abstract class `MarkExtension` extends the `SyntaxExtension` class. You should extend this class to provide support for custom ProseMirror marks.

#### Generic parameters

If you are using TypeScript, the `MarkExtension` class has two generic parameters that you need to specify.

##### `UNode extends UnistNode`

This specifies the unist node type that the extension handles.

##### `UnistToProseMirrorContext extends Record<string, unknown>`

This specifies the type of global context (shared across all extensions) that this extension expects. Default `Record<string, unknown>`.

#### Methods

##### `abstract proseMirrorMarkName(): string | null`

This method should return the type of the ProseMirror mark this extension handles or `null` if it doesn't produce any ProseMirror marks. No two extensions may return the same name - doing so throws when the schema is built, or logs a warning during translation if only one of the two extensions provides a mark spec.

##### `abstract proseMirrorMarkSpec(): MarkSpec | null`

This method should return a ProseMirror mark spec for the ProseMirror mark it produces or `null` if it doesn't produce any ProseMirror marks.

##### `abstract processConvertedUnistNode(convertedNode: UnistNode, originalMark: Mark): UNode`

This method is called when converting from ProseMirror to unist. The ProseMirror node has already been translated using an appropriate `NodeExtension` and the resulting unist node is passed to this method as a parameter, together with the mark that was applied to the original ProseMirror node. It is called for every mark on the original ProseMirror node whose type name matches `this.proseMirrorMarkName()`. This function should post-process the unist node to produce the correct result for the given mark. If the node carried several marks, the unist node passed in may already have been post-processed by the `MarkExtension`s of the other marks.

### The `MarkInputRule` class

This class extends the `InputRule` class provided by ProseMirror and should be used to create input rules that add marks to the document.

#### Methods

##### `constructor(matcher: RegExp, markType: MarkType)`

Creates a new input rule that adds the mark specified by `markType` if the user input matches the provided `matcher`.

The `matcher` must end with `$` and must contain two named capturing groups:

- `content` — the text the mark is applied to. The whole match is replaced by this group, which is how the surrounding delimiters (e.g. the asterisks around bold text) get removed.
- `trailing` — the text typed after the closing delimiter. It is re-inserted verbatim after the mark has been applied, and may be longer than one character. A `trailing` match consisting of a single newline is not re-inserted, because the newline is handled outside of the text node.

The `trailing` group may be made optional, in which case the rule also applies when nothing follows the closing delimiter — the rule then triggers as soon as the delimiter itself is typed:

```ts
new MarkInputRule(/<b>(?<content>.*)<\/b>(?<trailing>.)?$/u, schema.marks["bold"]);
```

A rule that never has any trailing text can use an empty group:

```ts
new MarkInputRule(/<b>(?<content>.*)<\/b>(?<trailing>)?$/u, schema.marks["bold"]);
```

Note that requiring trailing text is what lets a matcher with a variable-length delimiter resolve the delimiter unambiguously, so making `trailing` optional is only appropriate for marks with a fixed delimiter.

Any other capturing groups are ignored, so they may be used freely.

### `createProseMirrorNode(nodeName: string | null, schema: Schema<string, string>, children: Array<ProseMirrorNode>, attrs: Attrs = {}): Array<ProseMirrorNode>`

A helper function that creates a ProseMirror node based on `nodeName` with the specified children and attributes. Returns `[]` if `nodeName` is `null`. This function is useful when creating `NodeExtension`s
