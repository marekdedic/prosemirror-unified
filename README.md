# prosemirror-unified

[![NPM Version](https://img.shields.io/npm/v/prosemirror-unified?logo=npm)](https://www.npmjs.com/package/prosemirror-unified)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marekdedic/prosemirror-unified/CI.yml?branch=master&logo=github)](https://github.com/marekdedic/prosemirror-unified/actions/workflows/CI.yml)
[![Codecov (with branch)](https://img.shields.io/codecov/c/github/marekdedic/prosemirror-unified/master?logo=codecov)](https://app.codecov.io/gh/marekdedic/prosemirror-unified)
[![NPM Downloads](https://img.shields.io/npm/dm/prosemirror-unified?logo=npm)](https://www.npmjs.com/package/prosemirror-unified)
[![NPM License](https://img.shields.io/npm/l/prosemirror-unified)](https://github.com/marekdedic/prosemirror-unified/blob/master/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-vitepress-blue?logo=vite)](https://marekdedic.github.io/prosemirror-unified/)

This package provides support for using the [unified](https://github.com/unifiedjs/unified) ecosystem of parsers and other packages (for example, [remark](https://github.com/remarkjs/remark), the markdown parser) in [ProseMirror](https://prosemirror.net/).

prosemirror-unified is a framework: concrete syntaxes live in separate extension packages. For markdown, use [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark); to support another syntax, you can write your own extensions.

## Documentation

Full documentation — a guide to using prosemirror-unified, a walkthrough for writing your own extensions, and the API reference — is available at **[marekdedic.github.io/prosemirror-unified](https://marekdedic.github.io/prosemirror-unified/)**.

## Example

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
