import type { InputRule } from "prosemirror-inputrules";

import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { expect, test } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

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

const testerWithBoldRule = (): ProseMirrorTester => {
  const extension = new BoldInputRuleExtension();
  const manager = new ExtensionManager([extension]);

  return new ProseMirrorTester(
    schemaWithBold.nodes["doc"].create(
      null,
      schemaWithBold.nodes["paragraph"].create(),
    ),
    {
      // Keymap plugin comes second so that the input rules get the Enter
      // Key first, just like in ProseMirrorUnified.
      plugins: [
        new InputRulesBuilder(manager, schemaWithBold).build(),
        new KeymapBuilder(manager, schemaWithBold).build(),
      ],
    },
  );
};

test("InputRulesBuilder applies an input rule on Enter", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.selectText("end");
  testEditor.insertText("Hello <b>World</b>");
  testEditor.insertText("{Enter}");

  const expectedDoc = schemaWithBold.nodes["doc"].create(null, [
    schemaWithBold.nodes["paragraph"].create(null, [
      schemaWithBold.text("Hello "),
      schemaWithBold
        .text("World")
        .mark([schemaWithBold.marks["bold"].create()]),
    ]),
    schemaWithBold.nodes["paragraph"].create(),
  ]);

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});

test("InputRulesBuilder only splits the block when Enter matches no rule", () => {
  expect.assertions(1);

  const testEditor = testerWithBoldRule();
  testEditor.selectText("end");
  testEditor.insertText("Hello");
  testEditor.insertText("{Enter}");

  const expectedDoc = schemaWithBold.nodes["doc"].create(null, [
    schemaWithBold.nodes["paragraph"].create(null, [
      schemaWithBold.text("Hello"),
    ]),
    schemaWithBold.nodes["paragraph"].create(),
  ]);

  expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
});
