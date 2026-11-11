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

export function buildPastePlugin(
  unistToProseMirrorConverter: UnistToProseMirrorConverter,
  parseToUnist: (source: string) => UnistNode,
): Plugin {
  return new Plugin({
    props: {
      // Typed as always returning a Slice, but ProseMirror falls back to its
      // default plain text handling when the parser returns null.
      clipboardTextParser: ((text, $context, plain): Slice | null =>
        parse(
          unistToProseMirrorConverter,
          parseToUnist,
          text,
          $context.marks(),
          plain,
        )) as NonNullable<EditorProps["clipboardTextParser"]>,
    },
  });
}

/**
 * Adds the marks to every inline node in the fragment, where its parent
 * allows them. A mark is skipped if it excludes, or is excluded by, a mark
 * the inline node already has, so that the pasted marks take precedence.
 */
function addMarks(
  fragment: Fragment,
  marks: ReadonlyArray<Mark>,
  parent: NodeType,
): Fragment {
  if (marks.length === 0) {
    return fragment;
  }
  const nodes: Array<ProseMirrorNode> = [];
  fragment.forEach((node) => {
    const markedNode = node.copy(addMarks(node.content, marks, node.type));
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

function parse(
  unistToProseMirrorConverter: UnistToProseMirrorConverter,
  parseToUnist: (source: string) => UnistNode,
  text: string,
  marks: ReadonlyArray<Mark>,
  plain: boolean,
): Slice | null {
  if (plain) {
    return null;
  }
  // Like ProseMirror's own plain text paste, normalise line breaks.
  const source = text.replace(/\r\n?/gu, "\n").replace(/\n$/u, "");
  // ProseMirror itself skips the parser in code nodes, but not in code marks,
  // where the text is literal too. A single line is inserted directly, so
  // that the marks are kept even if they can't be parsed from the DOM, as
  // ProseMirror's own plain text paste would need.
  const codeMark = marks.find((mark) => mark.type.spec.code === true);
  if (codeMark !== undefined) {
    return source === "" || source.includes("\n")
      ? null
      : new Slice(
          Fragment.from(codeMark.type.schema.text(source, marks)),
          0,
          0,
        );
  }
  // Whitespace parses to an empty document, which would paste nothing.
  if (source.trim() === "") {
    return null;
  }
  try {
    // Keeps unconvertible content as text, or returns null if it can't.
    const doc = unistToProseMirrorConverter.convertKeepingSource(
      parseToUnist(source),
      source,
    );
    if (doc === null) {
      return null;
    }
    // Like ProseMirror's own plain text paste, keep the marks at the cursor.
    // ProseMirror opens the slice as far as possible afterwards.
    return new Slice(addMarks(doc.content, marks, doc.type), 0, 0);
  } catch (error) {
    // Throwing from here would let the browser paste natively. Report the
    // error and fall back to the default plain text paste instead.
    // eslint-disable-next-line no-console -- Intended console error
    console.error(error);
    return null;
  }
}
