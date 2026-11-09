import type { EditorProps } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import {
  Fragment,
  type Mark,
  type NodeType,
  type Node as ProseMirrorNode,
  Slice,
} from "prosemirror-model";
import { Plugin } from "prosemirror-state";

import type { UnistToProseMirrorConverter } from "./UnistToProseMirrorConverter";

export class PastePluginBuilder {
  private readonly parseToUnist: (source: string) => UnistNode;
  private plugin: Plugin | undefined;
  private readonly unistToProseMirrorConverter: UnistToProseMirrorConverter;

  public constructor(
    unistToProseMirrorConverter: UnistToProseMirrorConverter,
    parseToUnist: (source: string) => UnistNode,
  ) {
    this.unistToProseMirrorConverter = unistToProseMirrorConverter;
    this.parseToUnist = parseToUnist;
  }

  /**
   * Adds the marks to every inline node in the fragment, where its parent
   * allows them. A mark is skipped if it excludes, or is excluded by, a mark
   * the inline node already has, so that the pasted marks take precedence.
   */
  private static addMarks(
    fragment: Fragment,
    marks: ReadonlyArray<Mark>,
    parent: NodeType,
  ): Fragment {
    if (marks.length === 0) {
      return fragment;
    }
    const nodes: Array<ProseMirrorNode> = [];
    fragment.forEach((node) => {
      const markedNode = node.copy(
        PastePluginBuilder.addMarks(node.content, marks, node.type),
      );
      if (!node.isInline) {
        nodes.push(markedNode);
        return;
      }
      let nodeMarks = node.marks;
      for (const mark of marks) {
        const conflicts = node.marks.some(
          (other) =>
            mark.type.excludes(other.type) || other.type.excludes(mark.type),
        );
        if (!conflicts && parent.allowsMarkType(mark.type)) {
          nodeMarks = mark.addToSet(nodeMarks);
        }
      }
      nodes.push(markedNode.mark(nodeMarks));
    });
    return Fragment.from(nodes);
  }

  /**
   * Builds the plugin on the first call only, and returns the same instance
   * from then on.
   */
  public build(): Plugin {
    this.plugin ??= new Plugin({
      props: {
        // Typed as always returning a Slice, but ProseMirror falls back to its
        // default plain text handling when the parser returns null.
        clipboardTextParser: ((text, $context, plain): Slice | null =>
          this.parse(text, $context.marks(), plain)) as NonNullable<
          EditorProps["clipboardTextParser"]
        >,
      },
    });
    return this.plugin;
  }

  private parse(
    text: string,
    marks: ReadonlyArray<Mark>,
    plain: boolean,
  ): Slice | null {
    if (plain) {
      return null;
    }
    // Like ProseMirror's own plain text paste, normalise line breaks.
    const source = text.replace(/\r\n?/gu, "\n").replace(/\n$/u, "");
    // Whitespace parses to an empty document, which would paste nothing.
    if (source.trim() === "") {
      return null;
    }
    try {
      // Keeps unconvertible content as text, or returns null if it can't.
      const doc = this.unistToProseMirrorConverter.convertKeepingSource(
        this.parseToUnist(source),
        source,
      );
      if (doc === null) {
        return null;
      }
      // Like ProseMirror's own plain text paste, keep the marks at the cursor.
      // ProseMirror opens the slice as far as possible afterwards.
      return new Slice(
        PastePluginBuilder.addMarks(doc.content, marks, doc.type),
        0,
        0,
      );
    } catch (error) {
      // Throwing from here would let the browser paste natively. Report the
      // error and fall back to the default plain text paste instead.
      // eslint-disable-next-line no-console -- Intended console error
      console.error(error);
      return null;
    }
  }
}
