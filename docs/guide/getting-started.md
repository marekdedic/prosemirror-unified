# Getting started

This page shows the quickest path to a working markdown editor, using [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark). If you need to support a syntax other than markdown, see [Developing extensions](/developing/overview) instead.

## Installation

Install prosemirror-remark; prosemirror-unified comes with it as a dependency:

::: code-group

```sh [npm]
npm install prosemirror-remark
```

```sh [pnpm]
pnpm add prosemirror-remark
```

```sh [yarn]
yarn add prosemirror-remark
```

:::

You will also need ProseMirror's own packages (`prosemirror-state`, `prosemirror-view`, `prosemirror-model`) if they are not already in your project.

## Wiring up an editor

Construct a `ProseMirrorUnified` adapter with the `MarkdownExtension` from prosemirror-remark, then use it to build the schema, parse the initial content, and register input rules, keymaps and node views on your `EditorView`:

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

- **`parse(source)`** turns a source string (markdown, here) into a ProseMirror document — useful for setting the editor's initial contents.
- **`serialize(doc)`** does the inverse, turning the editor's document back into a source string — useful for saving.
- **`schema()`** returns a ProseMirror schema supporting all the extensions you passed in.
- **`inputRulesPlugin()`** and **`keymapPlugin()`** return ProseMirror plugins wiring up every extension's input rules (e.g. typing `**text**` to get bold) and keyboard shortcuts (e.g. Ctrl-b).
- **`nodeViews()`** returns the node views registered by your extensions, for interactive elements such as task lists.

That is the whole surface most users need. The [API reference](/guide/api) documents each of these with its full signature and behaviour; for anything markdown-specific, see the [prosemirror-remark documentation](https://github.com/marekdedic/prosemirror-remark).
