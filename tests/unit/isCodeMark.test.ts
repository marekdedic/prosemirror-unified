import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { expect, test } from "vitest";

import { isCodeMark } from "../../src/isCodeMark";

const schema = new Schema({
  marks: {
    bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
    code: { code: true, toDOM: (): DOMOutputSpec => ["code", 0] },
    notCode: { code: false, toDOM: (): DOMOutputSpec => ["span", 0] },
    // An untyped spec may set a truthy value other than true
    truthyCode: {
      code: 1 as unknown as boolean,
      toDOM: (): DOMOutputSpec => ["code", 0],
    },
  },
  nodes: {
    doc: { content: "text*" },
    text: {},
  },
});

test("isCodeMark recognises a mark whose spec sets code", () => {
  expect(isCodeMark(schema.marks.code.create())).toBe(true);
  expect(isCodeMark(schema.marks.truthyCode.create())).toBe(true);
});

test("isCodeMark rejects a mark whose spec does not set code", () => {
  expect(isCodeMark(schema.marks.bold.create())).toBe(false);
  expect(isCodeMark(schema.marks.notCode.create())).toBe(false);
});
