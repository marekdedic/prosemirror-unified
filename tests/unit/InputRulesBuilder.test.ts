import type { InputRule } from "prosemirror-inputrules";

import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { builders } from "prosemirror-test-builder";
import { expect, test } from "vitest";
import { type ProseMirrorEditor, renderProseMirror } from "vitest-prosemirror";

import { ExtensionManager } from "../../src/ExtensionManager";
import { InputRulesBuilder } from "../../src/InputRulesBuilder";
import { KeymapBuilder } from "../../src/KeymapBuilder";
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
        /<b>(?<content>[^\s](?:.*[^\s])?)<\/b>(?<trailing>[\s\S])$/u,
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
      // Keymap plugin comes second so that the input rules get the Enter
      // key first, just like in ProseMirrorUnified.
      plugins: [
        new InputRulesBuilder(manager, schemaWithBold).build(),
        new KeymapBuilder(manager, schemaWithBold).build(),
      ],
    },
  });
};

test("InputRulesBuilder applies an input rule on Enter", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.setSelection("end");
  testEditor.type("Hello <b>World</b>");
  testEditor.type("{Enter}");

  const expectedDoc = doc(paragraph("Hello ", bold("World")), paragraph());

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});

test("InputRulesBuilder only splits the block when Enter matches no rule", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.setSelection("end");
  testEditor.type("Hello");
  testEditor.type("{Enter}");

  const expectedDoc = doc(paragraph("Hello"), paragraph());

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});
