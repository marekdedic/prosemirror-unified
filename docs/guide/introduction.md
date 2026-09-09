# Introduction

prosemirror-unified connects the [unified](https://github.com/unifiedjs/unified) ecosystem of parsers and transformers with the [ProseMirror](https://prosemirror.net/) rich-text editor. It lets you load a document written in some concrete syntax into a ProseMirror editor and serialize the editor's contents back out again.

## Do you need this package directly?

prosemirror-unified is a **framework**. On its own it supports no concrete syntax — no markdown, no HTML, nothing. That knowledge lives in separate extension packages, and you almost always want one of those rather than prosemirror-unified by itself.

If you want to edit **markdown** in ProseMirror — which is the common case — reach for [**prosemirror-remark**](https://github.com/marekdedic/prosemirror-remark). It bundles all the extensions for markdown and is the package you install and use day to day. prosemirror-unified comes along as its dependency.

::: tip
Most users should head straight to [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark). You only work with prosemirror-unified directly if you are **building support for a new syntax** — see [Developing extensions](/developing/overview).
:::

## Next steps

- [Getting started](/guide/getting-started) — wire up a markdown editor with prosemirror-remark.
- [Developing extensions](/developing/overview) — add support for a syntax that doesn't have an extension yet.
