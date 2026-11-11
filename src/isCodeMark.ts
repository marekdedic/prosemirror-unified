import type { Mark } from "prosemirror-model";

/**
 * Whether a mark's spec sets `code`, i.e. its content is literal source text, such as inline code. Like prosemirror-inputrules, any truthy value counts.
 */
export const isCodeMark = (mark: Mark): boolean => Boolean(mark.type.spec.code);
