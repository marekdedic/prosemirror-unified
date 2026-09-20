# Introduction

prosemirror-unified connects the [unified](https://github.com/unifiedjs/unified) ecosystem of parsers and transformers with the [ProseMirror](https://prosemirror.net/) rich-text editor. It lets you load a document written in some concrete syntax into a ProseMirror editor and serialize the editor's contents back out again.

## A framework, not a syntax

prosemirror-unified is a **framework**. On its own it supports no concrete syntax — no markdown, no HTML, nothing. That knowledge lives in separate extension packages, and you combine the ones you need through a small adapter class.

For the common case — editing **markdown** — that package is [**prosemirror-remark**](https://github.com/marekdedic/prosemirror-remark). It bundles all the markdown extensions and pulls prosemirror-unified in as a dependency. You install prosemirror-remark and drive it through prosemirror-unified's adapter, which [Getting started](/guide/getting-started) walks through end to end.

That adapter is the whole surface most users ever touch, so this Guide is short — read on to [Getting started](/guide/getting-started) and you'll have a working editor.

::: tip Building a new syntax?
If there's no extension package for the syntax you want, you can write your own. That's a different job with its own docs — see [Developing extensions](/developing/overview).
:::

## Next steps

- [Getting started](/guide/getting-started) — wire up a markdown editor with prosemirror-remark.
- [Developing extensions](/developing/overview) — add support for a syntax that doesn't have an extension yet.
