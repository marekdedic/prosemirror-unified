import type {
  Mark,
  MarkType,
  Node as ProseMirrorNode,
} from "prosemirror-model";

import { InputRule } from "prosemirror-inputrules";
import {
  type EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { isCodeMark } from "./isCodeMark";

// The object replacement character (U+FFFC), which prosemirror-inputrules puts in place of every inline leaf node
const LEAF_NODE_PLACEHOLDER = String.fromCodePoint(0xfffc);

export interface MarkInputRuleOptions {
  /**
   * Whether the rule applies when the content contains an inline leaf node (an image, a hard break). Defaults to `false`.
   */
  allowLeafNodes?: boolean;
  /**
   * Passed through to `InputRule`: whether the rule applies inside nodes marked as code, or only there.
   */
  inCode?: "only" | boolean;
  /**
   * Passed through to `InputRule`: whether the rule applies inside marks marked as code.
   * Regardless of this option, the rule never removes a delimiter that is in a code mark or would be typed with one.
   */
  inCodeMark?: boolean;
  /**
   * Passed through to `InputRule`: whether `undoInputRule` can undo the rule.
   */
  undoable?: boolean;
}

/**
 * Whether a regular expression source consists of exactly top-level named capturing groups with the given names, in this order, followed by "$".
 * Inside a group, escapes and character classes are skipped, so parentheses in them don't count.
 * Nested character classes (with the v flag) need no special handling, because parentheses in them must be escaped.
 */
const consistsOfNamedGroups = (
  source: string,
  names: Array<string>,
): boolean => {
  let groupCount = 0;
  let groupDepth = 0;
  let inClass = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (groupDepth === 0) {
      if (groupCount === names.length) {
        return source.slice(i) === "$";
      }
      if (!source.startsWith(`(?<${names[groupCount]}>`, i)) {
        return false;
      }
      groupCount++;
      groupDepth++;
    } else if (char === "\\") {
      i++;
    } else if (inClass) {
      inClass = char !== "]";
    } else if (char === "[") {
      inClass = true;
    } else if (char === "(") {
      groupDepth++;
    } else if (char === ")") {
      groupDepth--;
    }
  }
  return false;
};

export class MarkInputRule extends InputRule {
  private readonly allowLeafNodes: boolean;
  private readonly mark: Mark;

  public constructor(
    matcher: RegExp,
    markType: MarkType,
    options: MarkInputRuleOptions = {},
  ) {
    const { allowLeafNodes, ...inputRuleOptions } = options;
    if (
      !consistsOfNamedGroups(matcher.source, [
        "opening",
        "content",
        "closing",
        "trailing",
      ])
    ) {
      throw new Error(
        'A MarkInputRule matcher must consist of exactly the named capturing groups "opening", "content", "closing" and "trailing", in this order, followed by "$".',
      );
    }
    // With these flags, the matcher would be stateful between runs (g, y), or "$" could match before the cursor (m).
    if (matcher.global || matcher.sticky || matcher.multiline) {
      throw new Error(
        'A MarkInputRule matcher must not have the "g", "m" or "y" flag.',
      );
    }
    super(
      matcher,
      (state, match, start, end) => this.markHandler(state, match, start, end),
      inputRuleOptions,
    );
    this.allowLeafNodes = allowLeafNodes ?? false;
    this.mark = markType.create(null);
  }

  /**
   * Where the range the typed text replaces starts. It ends at `end`, but the handler isn't told where it starts.
   * A selection ending at `end` that the typed text can have replaced is taken to be that range, which holds whenever the input replaces the selection.
   * But when the document holds the matched text up to `end`, the typed text may as well have been inserted there, and taking it to replace the selection would then delete and retype the selected content, losing its inline nodes and marks.
   * Otherwise, the typed text is taken to be inserted at `end`.
   */
  private static inputFrom(
    state: EditorState,
    start: number,
    end: number,
    holdsMatchToEnd: boolean,
  ): number {
    const { empty, from, to } = state.selection;
    if (!empty && from >= start && to === end && !holdsMatchToEnd) {
      return from;
    }
    return end;
  }

  /**
   * Whether the mark can be added to the inline nodes between `from` and `to` - the textblock must allow it (which also covers text typed there) and none of their marks may exclude it.
   */
  private static markApplies(
    doc: ProseMirrorNode,
    from: number,
    to: number,
    mark: Mark,
  ): boolean {
    if (!doc.resolve(from).parent.type.allowsMarkType(mark.type)) {
      return false;
    }
    const inlineNodes: Array<ProseMirrorNode> = [];
    doc.nodesBetween(from, to, (node) => {
      if (node.isInline) {
        inlineNodes.push(node);
      }
    });
    return inlineNodes.every((node) => mark.isInSet(mark.addToSet(node.marks)));
  }

  /**
   * Whether any of the inline nodes between `from` and `to` has a mark whose spec sets `code: true`, such as inline code.
   */
  private static rangeHasCodeMark(
    doc: ProseMirrorNode,
    from: number,
    to: number,
  ): boolean {
    let found = false;
    if (from < to) {
      doc.nodesBetween(from, to, (node) => {
        if (!found) {
          found = node.isInline && node.marks.some(isCodeMark);
        }
      });
    }
    return found;
  }

  private markHandler(
    state: EditorState,
    match: RegExpMatchArray,
    start: number,
    end: number,
  ): Transaction | null {
    const { closing, content, opening, trailing } = match.groups as {
      closing: string;
      content: string;
      opening: string;
      trailing: string;
    };

    // An empty mark would just delete the delimiters, and the delimiters must never delete a leaf node. The trailing text is not deleted, so it may contain leaf nodes.
    if (
      content === "" ||
      opening.includes(LEAF_NODE_PLACEHOLDER) ||
      closing.includes(LEAF_NODE_PLACEHOLDER) ||
      (!this.allowLeafNodes && content.includes(LEAF_NODE_PLACEHOLDER))
    ) {
      return null;
    }

    // The document holds the match up to `from`. The rest of it is the typed text, which replaces the range from `from` to `end` - multi-character input (e.g. from autocorrect) may reach into the content or further.
    // The parts of the groups in the document are deleted, marked or kept in place, and the typed parts of the content and the trailing text are inserted.
    // Whether the document holds the match up to `end`, as it does when the typed text is inserted there
    const holdsMatchToEnd =
      state.doc.textBetween(start, end, undefined, LEAF_NODE_PLACEHOLDER) ===
      match[0].slice(0, end - start);
    const from = MarkInputRule.inputFrom(state, start, end, holdsMatchToEnd);
    const openingTo = Math.min(start + opening.length, from);
    const contentTo = Math.min(openingTo + content.length, from);
    const closingTo = Math.min(contentTo + closing.length, from);
    const typedContent = content.slice(contentTo - openingTo);
    const trailingInDocument = from - closingTo;
    const typedTrailing = trailing.slice(trailingInDocument);

    // Typed text replacing a range across textblocks may replace whole nodes, which the range removed below wouldn't match
    const $from = state.doc.resolve(from);
    const $end = state.doc.resolve(end);
    if (!$from.sameParent($end)) {
      return null;
    }

    // Everything from the opening delimiter up to `from` gets deleted, marked or kept, so the document must hold exactly the matched text there.
    // It doesn't e.g. when the match contains an inline node with content, or when the typed text replaces a range that doesn't start where it is taken to.
    if (
      from === end
        ? !holdsMatchToEnd
        : state.doc.textBetween(
            start,
            from,
            undefined,
            LEAF_NODE_PLACEHOLDER,
          ) !== match[0].slice(0, from - start)
    ) {
      return null;
    }

    // A delimiter in code (e.g. inline code) is literal text, not a delimiter, whether it is in the document or would be typed with the marks the user is typing with. The content may contain code.
    // Typed text gets the marks `Transaction.insertText` gives it: the stored marks, or the marks at `end`, or across the range it replaces.
    const typingMarks =
      state.storedMarks ??
      (from < end ? ($from.marksAcross($end) ?? []) : $end.marks());
    const delimiterTyped =
      openingTo < start + opening.length ||
      closingTo < contentTo + closing.length;
    if (
      MarkInputRule.rangeHasCodeMark(state.doc, start, openingTo) ||
      MarkInputRule.rangeHasCodeMark(state.doc, contentTo, closingTo) ||
      (delimiterTyped && typingMarks.some(isCodeMark))
    ) {
      return null;
    }

    // The marks the user is typing with, without the new one
    const marksAfter = this.mark.type.removeFromSet(typingMarks);
    const { mark } = this;
    const typedContentMarks = mark.addToSet(marksAfter);

    // Removing the delimiters while the mark can't be added to all of the content (e.g. because of a mark that excludes it) would lose the mark silently
    if (
      !MarkInputRule.markApplies(state.doc, openingTo, contentTo, mark) ||
      (typedContent !== "" && !mark.isInSet(typedContentMarks))
    ) {
      return null;
    }

    // Remove the replaced range, which the typed text takes the place of, and the delimiters (e.g. the asterisks around italic). Deleting from the end first keeps the positions before valid.
    const tr = state.tr
      .delete(from, end)
      .delete(contentTo, closingTo)
      .delete(start, openingTo);

    // Add the mark to the content in place, which keeps any leaf nodes and marks already in it, and insert the typed rest of the content with it
    const contentInDocumentTo = start + (contentTo - openingTo);
    tr.addMark(start, contentInDocumentTo, mark);
    if (typedContent !== "") {
      tr.insert(
        contentInDocumentTo,
        state.schema.text(typedContent, typedContentMarks),
      );
    }

    // Add the rest of the trailing text after the part in the document if there is any and it is not a newline,
    // otherwise omit it because newline is handled out of the text node.
    // It gets the marks the user is typing with, so it doesn't get the new mark.
    let cursor = contentInDocumentTo + typedContent.length + trailingInDocument;
    if (typedTrailing !== "" && typedTrailing !== "\n") {
      tr.insert(cursor, state.schema.text(typedTrailing, marksAfter));
      cursor += typedTrailing.length;
    }

    // Place the cursor explicitly - the typed text may have replaced a selection, which doesn't map there
    tr.setSelection(TextSelection.create(tr.doc, cursor));

    // Make the text editor insert text without the new mark on next input. This comes last, because every step resets the stored marks.
    tr.setStoredMarks(marksAfter);

    return tr;
  }
}
