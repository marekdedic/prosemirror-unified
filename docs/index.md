---
layout: home

hero:
  name: prosemirror-unified
  text: Bring unified into ProseMirror
  tagline: A framework for parsing and serializing ProseMirror documents through the unified ecosystem — remark, rehype and any other unist-based plugin.
  actions:
    - theme: brand
      text: Getting started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/marekdedic/prosemirror-unified

features:
  - title: Syntax-agnostic by design
    details: The core knows nothing about any concrete syntax. Markdown, HTML and everything else lives in extensions, so you pull in only the syntaxes you need.
  - title: Powered by unified
    details: Parse and serialize through the unified processor and reuse its huge plugin ecosystem — remark for markdown, rehype for HTML, and any unist-based transform in between.
  - title: Extensible end to end
    details: Extensions contribute schema nodes and marks, input rules, keymaps and node views, converting between unist syntax trees and ProseMirror documents in both directions.
---
