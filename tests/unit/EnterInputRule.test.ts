import { InputRule, inputRules } from "prosemirror-inputrules";
import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { builders } from "prosemirror-test-builder";
import { expect, test } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import {
  EnterInputRule,
  type EnterInputRuleHandler,
  isEnterInputRule,
} from "../../src/EnterInputRule";

const schema = new Schema<string, string>({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: (): DOMOutputSpec => ["p", 0] },
    text: {},
  },
});

const { doc, paragraph } = builders(schema);

test("EnterInputRule applies to typed text like an InputRule", () => {
  const rule = new EnterInputRule(/->$/u, (state, _, start, end) =>
    state.tr.insertText("→", start, end),
  );
  const testEditor = renderProseMirror(doc(paragraph()), {
    editorProps: { plugins: [inputRules({ rules: [rule] })] },
  });
  testEditor.setSelection("end");
  testEditor.type("a->");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("a→")));
});

test("EnterInputRule passes the options to InputRule", () => {
  const rule = new EnterInputRule(/->$/u, () => null, {
    inCode: "only",
    inCodeMark: false,
  });

  expect(rule.inCode).toBe("only");
  expect(rule.inCodeMark).toBe(false);
});

test("EnterInputRule rejects a string handler", () => {
  expect(
    () => new EnterInputRule(/->$/u, "→" as unknown as EnterInputRuleHandler),
  ).toThrow(TypeError);
});

test("isEnterInputRule recognises an EnterInputRule", () => {
  expect(isEnterInputRule(new EnterInputRule(/->$/u, () => null))).toBe(true);
});

test("isEnterInputRule doesn't recognise other input rules", () => {
  expect(isEnterInputRule(new InputRule(/->$/u, "→"))).toBe(false);
});

test("isEnterInputRule recognises an EnterInputRule from another copy of the package", () => {
  // Stands in for a rule built by another copy, which only shares the registered symbol
  const rule = new InputRule(/->$/u, "→");
  Object.defineProperty(
    rule,
    Symbol.for("prosemirror-unified.EnterInputRule"),
    {
      value: true,
    },
  );

  expect(isEnterInputRule(rule)).toBe(true);
});
