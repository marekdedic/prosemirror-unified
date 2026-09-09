# Writing an extension

This page walks through building extensions for a tiny syntax — enough to represent a document of paragraphs, text and bold — so you see both a `NodeExtension` and a `MarkExtension`, in both translation directions, end to end. Read the [Overview](/developing/overview) first for the concepts, and keep the [Extension API](/developing/extensions) open for the full signatures.

Throughout, an extension does two jobs for its node: contribute to the ProseMirror **schema**, and **translate** the node to and from unist.

## Describing the unist nodes

Each extension handles one unist node type. In TypeScript you describe that node with an interface — the `type` string plus whatever fields it carries — and pass it as the extension's generic parameter:

```ts
import type { Node as UnistNode } from "unist";

export interface UnistText extends UnistNode {
  type: "text";
  value: string;
}
```

## A leaf node: text

The simplest extension is a leaf `NodeExtension`. Text carries a string and no children:

```ts
import type {
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { NodeExtension } from "prosemirror-unified";

export class TextExtension extends NodeExtension<UnistText> {
  public override unistNodeName(): "text" {
    return "text";
  }

  public override proseMirrorNodeName(): string {
    return "text";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return { group: "inline" };
  }

  // unist → ProseMirror
  public override unistNodeToProseMirrorNodes(
    node: UnistText,
    proseMirrorSchema: Schema<string, string>,
  ): Array<ProseMirrorNode> {
    return [proseMirrorSchema.text(node.value)];
  }

  // ProseMirror → unist
  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
  ): Array<UnistText> {
    return [{ type: "text", value: node.text ?? "" }];
  }
}
```

The two `…NodeName` methods declare which unist and ProseMirror node this extension owns; `proseMirrorNodeSpec` contributes the [ProseMirror node spec](https://prosemirror.net/docs/ref/#model.NodeSpec) to the shared schema. The two translation methods are mirror images — one builds a ProseMirror node from the unist node, the other rebuilds the unist node from the ProseMirror node.

## A container node: paragraph

A paragraph has no data of its own; it just wraps its children. Because its children are translated first, the translation methods receive them already converted, and the [`createProseMirrorNode`](/developing/extensions#createprosemirrornode-nodename-string-null-schema-schema-string-string-children-array-prosemirrornode-attrs-attrs) helper assembles the node:

```ts
import { createProseMirrorNode, NodeExtension } from "prosemirror-unified";

export class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public override unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public override proseMirrorNodeName(): string {
    return "paragraph";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return { content: "inline*", toDOM: () => ["p", 0] };
  }

  public override unistNodeToProseMirrorNodes(
    _: UnistParagraph,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
    );
  }

  public override proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UnistParagraph> {
    return [
      { type: "paragraph", children: convertedChildren as Array<UnistText> },
    ];
  }
}
```

### The document root

Every document needs a root. Exactly one extension must map to ProseMirror's top-level `doc` node — its `proseMirrorNodeName()` returns `"doc"` and its spec's `content` names the nodes allowed at the top level:

```ts
export class RootExtension extends NodeExtension<UnistRoot> {
  public override unistNodeName(): "root" {
    return "root";
  }

  public override proseMirrorNodeName(): "doc" {
    return "doc";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return { content: "paragraph+" };
  }

  // …translation methods, as above, using createProseMirrorNode
}
```

## A mark: bold

Bold is a `MarkExtension`: in ProseMirror it is a mark on a text node, while in unist it is a `bold` node wrapping a text node (see [unist and ProseMirror](/developing/overview#unist-and-prosemirror)). That asymmetry shapes its two translation methods:

```ts
import type { InputRule } from "prosemirror-inputrules";
import type { Command } from "prosemirror-state";

import { toggleMark } from "prosemirror-commands";
import { MarkExtension, MarkInputRule } from "prosemirror-unified";

export class BoldExtension extends MarkExtension<UnistBold> {
  public override unistNodeName(): "bold" {
    return "bold";
  }

  public override proseMirrorMarkName(): string {
    return "bold";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return { toDOM: () => ["strong"] };
  }

  // unist → ProseMirror: apply the mark to the already-converted children
  public override unistNodeToProseMirrorNodes(
    _: UnistBold,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark([
        proseMirrorSchema.marks[this.proseMirrorMarkName()].create(),
      ]),
    );
  }

  // ProseMirror → unist: wrap the already-converted text node in a bold node
  public override processConvertedUnistNode(
    convertedNode: UnistText,
  ): UnistBold {
    return { type: this.unistNodeName(), children: [convertedNode] };
  }
}
```

A `MarkExtension` translates from unist like any node — `unistNodeToProseMirrorNodes` here attaches the mark to its children rather than producing a new node. Going the other way it does **not** convert a node itself; instead `processConvertedUnistNode` post-processes the unist node that the text's `NodeExtension` already produced, wrapping it in a `bold` node.

### Input rules and keymaps

Marks are also where editor affordances usually live. Override `proseMirrorInputRules` to rewrite typed text into a mark — [`MarkInputRule`](/developing/extensions#markinputrule) handles the mark-adding case — and `proseMirrorKeymap` to bind a shortcut:

```ts
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /<b>(?<content>[^\s](?:.*[^\s])?)<\/b>(?<trailing>.)$/u,
        proseMirrorSchema.marks[this.proseMirrorMarkName()],
      ),
    ];
  }

  public override proseMirrorKeymap(
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {
      "Mod-b": toggleMark(proseMirrorSchema.marks[this.proseMirrorMarkName()]),
    };
  }
```

Both are also available on `NodeExtension`s — they live on the shared [`SyntaxExtension`](/developing/extensions#syntaxextension) base.

## Bundling the extensions

Users shouldn't have to register your extensions one by one. Wrap them in a plain [`Extension`](/developing/extensions#extension) that lists them as dependencies and plugs your unified parser and compiler into the processor — this is exactly what prosemirror-remark's `MarkdownExtension` does:

```ts
import { Extension } from "prosemirror-unified";

export class MiniSyntaxExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      new BoldExtension(),
    ];
  }

  public override unifiedInitializationHook(processor) {
    // Register the unified parser/compiler for your syntax here, e.g. remark.
    // See unifiedInitializationHook in the Extension API.
    return processor;
  }
}
```

`dependencies()` is expanded recursively and deduplicated, so a consumer only writes `new ProseMirrorUnified([new MiniSyntaxExtension()])` and gets the whole set — wired up exactly as in [Getting started](/guide/getting-started).

## Next steps

- [Extension API](/developing/extensions) — every class and method, with full signatures.
- [`ProseMirrorUnified` API](/guide/api) — how a consumer drives the extensions you built.
