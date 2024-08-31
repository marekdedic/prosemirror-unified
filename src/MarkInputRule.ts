import { InputRule } from "prosemirror-inputrules";
import type { MarkType, Node as ProseMirrorNode } from "prosemirror-model";
import {
  type EditorState,
  SelectionRange,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

/**
 * @public
 */
export class MarkInputRule extends InputRule {
  private readonly markType: MarkType;

  public constructor(matcher: RegExp, markType: MarkType) {
    super(matcher, (state, match, start, end) =>
      this.markHandler(state, match, start, end),
    );
    this.markType = markType;
  }

  private static markApplies(
    doc: ProseMirrorNode,
    ranges: Array<SelectionRange>,
    type: MarkType,
  ): boolean {
    for (const range of ranges) {
      const { $from, $to } = range;
      let applies = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
      doc.nodesBetween($from.pos, $to.pos, (node) => {
        if (applies) {
          return false;
        }
        applies = node.inlineContent && node.type.allowsMarkType(type);
        return true;
      });
      if (applies) {
        return true;
      }
    }
    return false;
  }

  private markHandler(
    state: EditorState,
    match: RegExpMatchArray,
    start: number,
    end: number,
  ): Transaction | null {
    if (!(state.selection instanceof TextSelection)) {
      return null;
    }

    // Determine if mark applies to match
    const $start = state.doc.resolve(start);
    const $end = state.doc.resolve(end);
    const range = [new SelectionRange($start, $end)];

    if (!MarkInputRule.markApplies(state.doc, range, this.markType)) {
      return null;
    }

    // List all existing marks and add the new one
    const newMarks =
      state.doc.nodeAt(start)?.marks.map((mark) => mark.type) ?? [];
    newMarks.push(this.markType);

    // Replace the affected range with the matched text - this removes e.g. the asterisks around italic
    const tr = state.tr.replaceWith(
      start,
      end,
      this.markType.schema.text(match[1]),
    );

    // Add back all marks, including the new one
    for (const markType of newMarks) {
      tr.addMark(
        tr.mapping.map(start),
        tr.mapping.map(end),
        markType.create(null),
      );
    }

    // Make the text editor insert clean text with no marks on next input
    for (const markType of newMarks) {
      tr.removeStoredMark(markType);
    }

    // Add back the last character
    return tr.insertText(match[2]);
  }
}
