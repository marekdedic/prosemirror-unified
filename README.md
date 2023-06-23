# prosemirror-unified

![GitHub](https://img.shields.io/github/license/marekdedic/prosemirror-unified)
![GitHub CI](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-unified/CI.yml?logo=github)
![Codecov](https://img.shields.io/codecov/c/github/marekdedic/prosemirror-unified/master?logo=codecov)
![npm downloads](https://img.shields.io/npm/dm/prosemirror-unified?logo=npm)

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
