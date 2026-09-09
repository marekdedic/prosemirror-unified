# Introduction

prosemirror-unified connects the [unified](https://github.com/unifiedjs/unified) ecosystem of parsers and transformers with the [ProseMirror](https://prosemirror.net/) rich-text editor. It lets you load a document written in some concrete syntax (such as markdown) into a ProseMirror editor and serialize the editor's contents back out again.

## A framework, not a syntax

Just as unified is a general framework that has to be extended for a particular syntax — remark for markdown, rehype for HTML, and so on — prosemirror-unified is a general framework for connecting unified with ProseMirror that has to be extended to support a particular syntax.

The core package knows nothing about markdown, HTML or any other concrete syntax. That knowledge lives in **extensions**, which you pass to the `ProseMirrorUnified` adapter. You only pull in the syntaxes you actually need.

Currently, the [prosemirror-remark](https://github.com/marekdedic/prosemirror-remark) package provides markdown support. If you want to support another syntax, you can write your own extensions — see [Creating your own extensions](https://github.com/marekdedic/prosemirror-unified#creating-your-own-extensions) in the README.

## unist and ProseMirror

unified represents documents as an abstract syntax tree of nodes, called [unist](https://github.com/syntax-tree/unist), starting from a root node for the whole document. ProseMirror works much the same way, with one important difference: ProseMirror has a concept of **marks** that can be applied to a node — bold text, for example, is a text node carrying a bold mark. unist has no marks; there, bold text is a `strong` node that contains a text node.

To bridge this difference, prosemirror-unified provides two kinds of extension:

- A **`NodeExtension`** translates between a unist node and a ProseMirror node — a paragraph, for example.
- A **`MarkExtension`** translates between a unist node and a ProseMirror mark — bold text, for example.

Both translate in both directions, so the same set of extensions is used to parse a document into the editor and to serialize it back out.

## Next steps

Head to [Getting started](/guide/getting-started) to install the package and wire up an editor.
