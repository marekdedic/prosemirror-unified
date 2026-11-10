import { baseKeymap } from "prosemirror-commands";
import { InputRule, undoInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { builders } from "prosemirror-test-builder";
import { expect, test, vi } from "vitest";
import { type ProseMirrorEditor, renderProseMirror } from "vitest-prosemirror";

import { buildInputRulesPlugin } from "../../src/buildInputRulesPlugin";
import { EnterInputRule } from "../../src/EnterInputRule";
import { ExtensionManager } from "../../src/ExtensionManager";
import { MarkInputRule } from "../../src/MarkInputRule";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

const schemaWithBold = new Schema<string, string>({
  marks: {
    bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
    code: { code: true, toDOM: (): DOMOutputSpec => ["code", 0] },
  },
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: (): DOMOutputSpec => ["p", 0] },
    text: {},
  },
});

const { bold, code, doc, paragraph } = builders(schemaWithBold);

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

// Replaces "!!" with "‼" on Enter, and nothing else
class DoubleExclamationExtension extends MockNodeExtension<{ type: "x" }> {
  public override proseMirrorInputRules(): Array<InputRule> {
    return [
      new EnterInputRule(/!!\n$/u, (state, _, start, end) =>
        state.tr.insertText("‼", start, end),
      ),
    ];
  }
}

const testerWithEnterRule = (): ProseMirrorEditor => {
  const manager = new ExtensionManager([new DoubleExclamationExtension()]);

  return renderProseMirror(doc(paragraph()), {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(manager, schemaWithBold),
        keymap(baseKeymap),
      ],
    },
  });
};

test("buildInputRulesPlugin stops Enter when an EnterInputRule applies", () => {
  const testEditor = testerWithEnterRule();
  testEditor.setSelection("end");
  testEditor.type("Hello!!");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello‼")));
});

test("buildInputRulesPlugin splits the block when an EnterInputRule doesn't apply", () => {
  const testEditor = testerWithEnterRule();
  testEditor.setSelection("end");
  testEditor.type("Hello!");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello!"), paragraph()),
  );
});

test("buildInputRulesPlugin undoes an EnterInputRule applied on Enter without inserting a line ending", () => {
  const testEditor = testerWithEnterRule();
  testEditor.setSelection("end");
  testEditor.type("Hello!!");
  testEditor.type("{Enter}");

  expect(testEditor.command(undoInputRule)).toBe(true);
  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello!!")));
});

test("buildInputRulesPlugin stops Enter when a non-undoable EnterInputRule applies", () => {
  const extension = new (class extends MockNodeExtension<{ type: "x" }> {
    public override proseMirrorInputRules(): Array<InputRule> {
      return [
        new EnterInputRule(
          /!!\n$/u,
          (state, _, start, end) => state.tr.insertText("‼", start, end),
          { undoable: false },
        ),
      ];
    }
  })();
  const testEditor = renderProseMirror(doc(paragraph()), {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(
          new ExtensionManager([extension]),
          schemaWithBold,
        ),
        keymap(baseKeymap),
      ],
    },
  });
  testEditor.setSelection("end");
  testEditor.type("Hello!!");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello‼")));
  expect(testEditor.command(undoInputRule)).toBe(false);
});

test.each([["Alt"], ["Control"], ["Meta"], ["Shift"]])(
  "buildInputRulesPlugin doesn't apply input rules on %s-Enter",
  (modifier) => {
    const boldEditor = testerWithBoldRule();
    boldEditor.setSelection("end");
    boldEditor.type("Hello <b>World</b>");
    boldEditor.type(`{${modifier}-Enter}`);

    expect(boldEditor.doc).toEqualProseMirrorNode(
      doc(paragraph(schemaWithBold.text("Hello <b>World</b>"))),
    );

    const enterEditor = testerWithEnterRule();
    enterEditor.setSelection("end");
    enterEditor.type("Hello!!");
    enterEditor.type(`{${modifier}-Enter}`);

    expect(enterEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello!!")));
  },
);

test("buildInputRulesPlugin keeps an earlier rule undoable after a non-undoable EnterInputRule", () => {
  const extension = new (class extends MockNodeExtension<{ type: "x" }> {
    public override proseMirrorInputRules(): Array<InputRule> {
      return [
        new InputRule(/->$/u, "→"),
        // Changes neither the document nor the selection, so the input
        // rules plugin keeps the record of the rule above
        new EnterInputRule(/→\n$/u, (state) => state.tr.setMeta("noop", true), {
          undoable: false,
        }),
      ];
    }
  })();
  const testEditor = renderProseMirror(doc(paragraph()), {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(
          new ExtensionManager([extension]),
          schemaWithBold,
        ),
        keymap(baseKeymap),
      ],
    },
  });
  testEditor.setSelection("end");
  testEditor.type("a->");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("a→")));
  expect(testEditor.command(undoInputRule)).toBe(true);
  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("a->")));
});

test("buildInputRulesPlugin applies an EnterInputRule before other rules on Enter", () => {
  const extension = new (class extends MockNodeExtension<{ type: "x" }> {
    public override proseMirrorInputRules(): Array<InputRule> {
      return [
        new InputRule(/!!\n$/u, "?"),
        new EnterInputRule(/!!\n$/u, (state, _, start, end) =>
          state.tr.insertText("‼", start, end),
        ),
      ];
    }
  })();
  const testEditor = renderProseMirror(doc(paragraph()), {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(
          new ExtensionManager([extension]),
          schemaWithBold,
        ),
        keymap(baseKeymap),
      ],
    },
  });
  testEditor.setSelection("end");
  testEditor.type("Hello!!");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello‼")));
});

test("buildInputRulesPlugin applies an EnterInputRule in a single transaction", () => {
  const transactionCountKey = new PluginKey<number>("transactionCount");
  const manager = new ExtensionManager([new DoubleExclamationExtension()]);
  const testEditor = renderProseMirror(doc(paragraph("Hello!!")), {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(manager, schemaWithBold),
        keymap(baseKeymap),
        new Plugin<number>({
          key: transactionCountKey,
          state: {
            apply: (_, count): number => count + 1,
            init: (): number => 0,
          },
        }),
      ],
    },
  });
  testEditor.setSelection("end");
  const countBefore = transactionCountKey.getState(testEditor.state) ?? 0;
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello‼")));
  expect(transactionCountKey.getState(testEditor.state)).toBe(countBefore + 1);
});

const testerWithRules = (
  rules: Array<InputRule>,
  document = doc(paragraph("Hello!!")),
): ProseMirrorEditor => {
  const extension = new (class extends MockNodeExtension<{ type: "x" }> {
    public override proseMirrorInputRules(): Array<InputRule> {
      return rules;
    }
  })();
  const testEditor = renderProseMirror(document, {
    editorProps: {
      plugins: [
        buildInputRulesPlugin(
          new ExtensionManager([extension]),
          schemaWithBold,
        ),
        keymap(baseKeymap),
      ],
    },
  });
  testEditor.setSelection("end");
  return testEditor;
};

test("buildInputRulesPlugin calls an EnterInputRule's handler once per Enter", () => {
  const handler = vi.fn(() => null);
  const testEditor = testerWithRules([
    new EnterInputRule(/l(o!)!\n$/u, handler),
  ]);
  const { state } = testEditor;
  testEditor.type("{Enter}");

  expect(handler).toHaveBeenCalledExactlyOnceWith(
    state,
    expect.arrayContaining(["lo!!\n", "o!"]),
    4,
    8,
  );
  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello!!"), paragraph()),
  );
});

test("buildInputRulesPlugin applies an EnterInputRule from another copy of the package on Enter", () => {
  // Stands in for a rule built by another copy, which only shares the registered symbol
  const rule = new InputRule(/!!\n$/u, (state, _, start, end) =>
    state.tr.insertText("‼", start, end),
  );
  Object.defineProperty(
    rule,
    Symbol.for("prosemirror-unified.EnterInputRule"),
    {
      value: true,
    },
  );
  const testEditor = testerWithRules([rule]);
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello‼")));
});

test("buildInputRulesPlugin applies an EnterInputRule on Enter the same way as to typed text", () => {
  const handler = vi.fn(() => null);
  // Doesn't apply inside a code mark
  const testEditor = testerWithRules(
    [new EnterInputRule(/!!\n$/u, handler, { inCodeMark: false })],
    doc(paragraph(code("Hello!!"))),
  );
  testEditor.type("{Enter}");

  expect(handler).not.toHaveBeenCalled();
});

test("buildInputRulesPlugin doesn't apply input rules on Enter outside a textblock", () => {
  const enterHandler = vi.fn(() => null);
  const otherHandler = vi.fn(() => null);
  const testEditor = testerWithRules([
    new EnterInputRule(/\n$/u, enterHandler),
    new InputRule(/\n$/u, otherHandler),
  ]);
  testEditor.setSelection("all");
  testEditor.type("{Enter}");

  expect(enterHandler).not.toHaveBeenCalled();
  expect(otherHandler).not.toHaveBeenCalled();
});

test("buildInputRulesPlugin keeps a plain rule applied on Enter undoable without inserting a line ending", () => {
  const manager = new ExtensionManager([new BoldInputRuleExtension()]);
  // Without the base keymap, nothing handles Enter after the rule, which
  // would otherwise discard its undo record.
  const testEditor = renderProseMirror(doc(paragraph()), {
    editorProps: { plugins: [buildInputRulesPlugin(manager, schemaWithBold)] },
  });
  testEditor.setSelection("end");
  testEditor.type("Hello <b>World</b>");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello ", bold("World"))),
  );
  expect(testEditor.command(undoInputRule)).toBe(true);
  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph(schemaWithBold.text("Hello <b>World</b>"))),
  );
});

test("buildInputRulesPlugin doesn't apply input rules on Enter across textblocks", () => {
  const enterHandler = vi.fn(() => null);
  const otherHandler = vi.fn(() => null);
  const testEditor = testerWithRules(
    [
      new EnterInputRule(/!!\n$/u, enterHandler),
      new InputRule(/!!\n$/u, otherHandler),
    ],
    doc(paragraph("Hello!!"), paragraph("World")),
  );
  // From the end of the first paragraph to after "Wo"
  testEditor.setSelection({ anchor: 8, head: 12 });
  testEditor.type("{Enter}");

  expect(enterHandler).not.toHaveBeenCalled();
  expect(otherHandler).not.toHaveBeenCalled();
  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello!!"), paragraph("rld")),
  );
});
