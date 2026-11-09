import type { InputRule } from "prosemirror-inputrules";

import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { builders } from "prosemirror-test-builder";
import { expect, test } from "vitest";
import { type ProseMirrorEditor, renderProseMirror } from "vitest-prosemirror";

import { buildInputRulesPlugin } from "../../src/buildInputRulesPlugin";
import { ExtensionManager } from "../../src/ExtensionManager";
import { MarkInputRule } from "../../src/MarkInputRule";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

const schemaWithBold = new Schema<string, string>({
  marks: {
    bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
  },
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: (): DOMOutputSpec => ["p", 0] },
    text: {},
  },
});

const { bold, doc, paragraph } = builders(schemaWithBold);

class BoldInputRuleExtension extends MockNodeExtension<{ type: "bold" }> {
  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [
      new MarkInputRule(
        /(?<opening><b>)(?<content>[^\s](?:.*[^\s])?)(?<closing><\/b>)(?<trailing>[\s\S])$/u,
        proseMirrorSchema.marks["bold"],
      ),
    ];
  }
}

const testerWithBoldRule = (): ProseMirrorEditor => {
  const extension = new BoldInputRuleExtension();
  const manager = new ExtensionManager([extension]);

  return renderProseMirror(doc(paragraph()), {
    editorProps: {
      // The base keymap comes after the input rules so that they get the
      // Enter key first, just like in ProseMirrorUnified.
      plugins: [
        buildInputRulesPlugin(manager, schemaWithBold),
        keymap(baseKeymap),
      ],
    },
  });
};

test("buildInputRulesPlugin applies an input rule on Enter", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.setSelection("end");
  testEditor.type("Hello <b>World</b>");
  testEditor.type("{Enter}");

  const expectedDoc = doc(paragraph("Hello ", bold("World")), paragraph());

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});

test("buildInputRulesPlugin only splits the block when Enter matches no rule", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.setSelection("end");
  testEditor.type("Hello");
  testEditor.type("{Enter}");

  const expectedDoc = doc(paragraph("Hello"), paragraph());

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});
