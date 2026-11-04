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
   */
  inCodeMark?: boolean;
  /**
   * Passed through to `InputRule`: whether `undoInputRule` can undo the rule.
   */
  undoable?: boolean;
}

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
      !["opening", "content", "closing", "trailing"].every((group) =>
        matcher.source.includes(`(?<${group}>`),
      )
    ) {
      throw new Error(
        'A MarkInputRule matcher must contain the named capturing groups "opening", "content", "closing" and "trailing".',
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

  private markHandler(
    state: EditorState,
    match: RegExpMatchArray,
    start: number,
    end: number,
  ): Transaction | null {
    // The constructor guarantees that all named groups are present in the matcher.
    // The trailing group may be optional and therefore not participate in the match.
    const { closing, content, opening, trailing } = match.groups as {
      closing: string;
      content: string;
      opening: string;
      trailing?: string;
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

    // Locate the groups in the match, counting back from its end.
    const matchedText = match[0];
    if (!matchedText.endsWith(opening + content + closing + (trailing ?? ""))) {
      throw new Error(
        'The named capturing groups "opening", "content", "closing" and "trailing" of a MarkInputRule matcher must be adjacent and in this order at the end of the match.',
      );
    }
    const closingOffset =
      matchedText.length - (trailing?.length ?? 0) - closing.length;
    const openingOffset = closingOffset - content.length - opening.length;
    const openingFrom = start + openingOffset;

    // The document holds the match up to `end`. The rest of it is the typed text, which isn't in the document yet - multi-character input (e.g. from autocorrect) may reach into the content or further.
    // The parts of the groups in the document are deleted, marked or kept in place, and the typed parts of the content and the trailing text are inserted.
    if (openingFrom > end) {
      return null;
    }
    const openingTo = Math.min(openingFrom + opening.length, end);
    const contentTo = Math.min(openingTo + content.length, end);
    const closingTo = Math.min(contentTo + closing.length, end);
    const typedContent = content.slice(contentTo - openingTo);
    const trailingInDocument = end - closingTo;
    const typedTrailing = (trailing ?? "").slice(trailingInDocument);

    // Everything from the opening delimiter up to `end` gets deleted, marked or kept, so the document must hold exactly the matched text there.
    // It doesn't e.g. when the typed text replaces a selection or when the match contains an inline node with content.
    if (
      state.doc.textBetween(
        openingFrom,
        end,
        undefined,
        LEAF_NODE_PLACEHOLDER,
      ) !== matchedText.slice(openingOffset, end - start)
    ) {
      return null;
    }

    // The marks the user is typing with, without the new one
    const marksAfter = this.mark.type.removeFromSet(
      state.storedMarks ?? state.doc.resolve(end).marks(),
    );
    const { mark } = this;
    const typedContentMarks = mark.addToSet(marksAfter);

    // Removing the delimiters while the mark can't be added to all of the content (e.g. because of a mark that excludes it) would lose the mark silently
    if (
      !MarkInputRule.markApplies(state.doc, openingTo, contentTo, mark) ||
      (typedContent !== "" && !mark.isInSet(typedContentMarks))
    ) {
      return null;
    }

    // Remove the delimiters (e.g. the asterisks around italic). Deleting the closing delimiter first keeps the positions of the opening one valid.
    const tr = state.tr
      .delete(contentTo, closingTo)
      .delete(openingFrom, openingTo);

    // Add the mark to the content in place, which keeps any leaf nodes and marks already in it, and insert the typed rest of the content with it
    const contentInDocumentTo = openingFrom + (contentTo - openingTo);
    tr.addMark(openingFrom, contentInDocumentTo, mark);
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
