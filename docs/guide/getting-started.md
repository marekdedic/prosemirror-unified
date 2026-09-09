# Getting started

## Installation

prosemirror-unified is the framework; on its own it supports no concrete syntax. To do anything useful you also need at least one extension package. For markdown, that is [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark):

::: code-group

```sh [npm]
npm install prosemirror-unified prosemirror-remark
```

```sh [pnpm]
pnpm add prosemirror-unified prosemirror-remark
```

```sh [yarn]
yarn add prosemirror-unified prosemirror-remark
```

:::

You will also need ProseMirror's own packages (`prosemirror-state`, `prosemirror-view`, `prosemirror-model`) if they are not already in your project.

## Wiring up an editor

The `ProseMirrorUnified` class is the adapter between ProseMirror and unified. You construct it with the list of extensions you want, then use it to build the schema, parse the initial content, and register input rules, keymaps and node views on your `EditorView`.

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
  },
);
```

## What the adapter gives you

- **`parse(source)`** turns a source string (markdown, when using prosemirror-remark) into a ProseMirror document — useful for setting the editor's initial contents.
- **`serialize(doc)`** does the inverse, turning the editor's document back into a source string — useful for saving.
- **`schema()`** returns a ProseMirror schema supporting all the extensions you passed in.
- **`inputRulesPlugin()`** and **`keymapPlugin()`** return ProseMirror plugins wiring up every extension's input rules (e.g. typing `**text**` to get bold) and keyboard shortcuts (e.g. Ctrl-b).
- **`nodeViews()`** returns the node views registered by your extensions, for interactive elements such as task lists.

For the full API and for writing your own extensions, see the [README](https://github.com/marekdedic/prosemirror-unified#readme).
