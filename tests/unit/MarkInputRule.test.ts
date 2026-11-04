import type { EditorView } from "prosemirror-view";

import { inputRules, undoInputRule } from "prosemirror-inputrules";
import {
  type DOMOutputSpec,
  type Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { EditorState, type Transaction } from "prosemirror-state";
import { describe, expect, type Mock, test, vi } from "vitest";
import { type ProseMirrorEditor, renderProseMirror } from "vitest-prosemirror";

import {
  MarkInputRule,
  type MarkInputRuleOptions,
} from "../../src/MarkInputRule";

describe("MarkInputRule works", () => {
  const errorMessage =
    'A MarkInputRule matcher must contain the named capturing groups "opening", "content", "closing" and "trailing".';

  const boldMatcher =
    /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.)$/u;

  const schema = new Schema({
    marks: {
      bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
      code: { code: true, toDOM: (): DOMOutputSpec => ["code", 0] },
      // Excludes all other marks
      exclusive: { excludes: "_", toDOM: (): DOMOutputSpec => ["span", 0] },
      italic: { toDOM: (): DOMOutputSpec => ["i", 0] },
    },
    nodes: {
      doc: { content: "paragraph+" },
      hardBreak: {
        group: "inline",
        inline: true,
        toDOM: (): DOMOutputSpec => ["br"],
      },
      mention: {
        content: "text*",
        group: "inline",
        inline: true,
        toDOM: (): DOMOutputSpec => ["span", 0],
      },
      paragraph: {
        content: "inline*",
        toDOM: (): DOMOutputSpec => ["p", 0],
      },
      text: { group: "inline" },
    },
  });

  // The paragraph disallows all marks, so a matching rule must not apply.
  const markLessSchema = new Schema({
    marks: {
      bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
      italic: { toDOM: (): DOMOutputSpec => ["i", 0] },
    },
    nodes: {
      doc: { content: "paragraph+" },
      hardBreak: {
        group: "inline",
        inline: true,
        toDOM: (): DOMOutputSpec => ["br"],
      },
      paragraph: {
        content: "inline*",
        marks: "",
        toDOM: (): DOMOutputSpec => ["p", 0],
      },
      text: { group: "inline" },
    },
  });

  const typeText = (
    ruleSchema: Schema<"doc" | "hardBreak" | "paragraph" | "text", "bold">,
    matcher: RegExp,
    text: string,
    {
      initialContent = [],
      ruleOptions = {},
    }: {
      initialContent?: Array<ProseMirrorNode>;
      ruleOptions?: MarkInputRuleOptions;
    } = {},
  ): ProseMirrorEditor => {
    const testEditor = renderProseMirror(
      ruleSchema.nodes.doc.create(
        null,
        ruleSchema.nodes.paragraph.create(null, initialContent),
      ),
      {
        editorProps: {
          plugins: [
            inputRules({
              rules: [
                new MarkInputRule(matcher, ruleSchema.marks.bold, ruleOptions),
              ],
            }),
          ],
        },
      },
    );

    testEditor.setSelection("end");
    testEditor.type(text);

    return testEditor;
  };

  // A paragraph containing "<b>a", a hard break and "b</b>"
  const contentWithLeafNode = (): Array<ProseMirrorNode> => [
    schema.text("<b>a"),
    schema.nodes.hardBreak.create(),
    schema.text("b</b>"),
  ];

  test("throws when the matcher is missing all named groups", () => {
    expect(
      () => new MarkInputRule(/<b>(.*)<\/b>(.)$/u, schema.marks.bold),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the content group", () => {
    expect(
      () =>
        new MarkInputRule(
          /(?<opening><b>)(.*)(?<closing><\/b>)(?<trailing>.)$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the trailing group", () => {
    expect(
      () =>
        new MarkInputRule(
          /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(.)$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the opening group", () => {
    expect(
      () =>
        new MarkInputRule(
          /<b>(?<content>.*)(?<closing><\/b>)(?<trailing>.)$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the closing group", () => {
    expect(
      () =>
        new MarkInputRule(
          /(?<opening><b>)(?<content>.*)<\/b>(?<trailing>.)$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("throws when a named group is misspelled", () => {
    expect(
      () =>
        new MarkInputRule(
          /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailng>.)?$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("throws when the named groups are not adjacent at the end of the match", () => {
    expect(() =>
      typeText(
        schema,
        /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.)!$/u,
        "<b>bold</b> !",
      ),
    ).toThrow(
      'The named capturing groups "opening", "content", "closing" and "trailing" of a MarkInputRule matcher must be adjacent and in this order at the end of the match.',
    );
  });

  test("strips the delimiters and applies the mark", () => {
    const testEditor = typeText(schema, boldMatcher, "<b>bold</b> ");

    expect(testEditor.doc.textContent).toBe("bold ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
    expect(testEditor.doc.nodeAt(1)?.marks[0].type.name).toBe("bold");
    expect(testEditor.doc.nodeAt(5)?.marks).toHaveLength(0);
  });

  test("does not apply the mark to text typed after the rule", () => {
    const testEditor = typeText(
      schema,
      /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.)?$/u,
      "<b>bold</b>x",
    );

    expect(testEditor.doc.textContent).toBe("boldx");
    expect(testEditor.doc.nodeAt(5)?.marks).toHaveLength(0);
  });

  test("works with delimiters defined through other groups", () => {
    // The opening and closing groups wrap a backreferenced delimiter
    const testEditor = typeText(
      schema,
      /(?<opening>(?<delimiter>`+))(?<content>[^`]+)(?<closing>\k<delimiter>)(?<trailing>.)$/u,
      "``code`` ",
    );

    expect(testEditor.doc.textContent).toBe("code ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });

  test("keeps text matched before the opening delimiter", () => {
    const testEditor = typeText(
      schema,
      /(?:^|\s)(?<opening>\*)(?<content>[^*]+)(?<closing>\*)(?<trailing>.)$/u,
      "x *bold* ",
    );

    expect(testEditor.doc.textContent).toBe("x bold ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
    expect(testEditor.doc.nodeAt(3)?.marks).toHaveLength(1);
  });

  test("keeps marks already present on the content", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: [
        schema.text("<b>a"),
        schema.text("b", [schema.marks.italic.create()]),
        schema.text("c</b>"),
      ],
    });

    expect(testEditor.doc.textContent).toBe("abc ");
    expect(
      testEditor.doc.nodeAt(2)?.marks.map((mark) => mark.type.name),
    ).toStrictEqual(["bold", "italic"]);
    expect(
      testEditor.doc.nodeAt(1)?.marks.map((mark) => mark.type.name),
    ).toStrictEqual(["bold"]);
  });

  test("does not apply the mark across a leaf node by default", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: contentWithLeafNode(),
    });

    expect(testEditor.doc.textContent).toBe("<b>ab</b> ");
    expect(testEditor.doc.child(0).child(1).type.name).toBe("hardBreak");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
  });

  test("applies the mark across a leaf node when allowed", () => {
    expect.assertions(7);

    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: contentWithLeafNode(),
      ruleOptions: { allowLeafNodes: true },
    });
    const paragraph = testEditor.doc.child(0);

    expect(testEditor.doc.textContent).toBe("ab ");
    expect(paragraph.childCount).toBe(4);
    expect(paragraph.child(1).type.name).toBe("hardBreak");

    for (const index of [0, 1, 2]) {
      expect(
        paragraph.child(index).marks.map((mark) => mark.type.name),
      ).toStrictEqual(["bold"]);
    }

    expect(paragraph.child(3).marks).toHaveLength(0);
  });

  test("re-inserts a multi-character trailing match", () => {
    expect(
      typeText(
        schema,
        /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>\s\s)$/u,
        "<b>bold</b>  ",
      ).doc.textContent,
    ).toBe("bold  ");
  });

  test("works with an optional trailing group that does not match", () => {
    const testEditor = typeText(
      schema,
      /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.)?$/u,
      "<b>bold</b>",
    );

    expect(testEditor.doc.textContent).toBe("bold");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });

  test("works with a matcher that has no trailing text at all", () => {
    const testEditor = typeText(
      schema,
      /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>)?$/u,
      "<b>bold</b>",
    );

    expect(testEditor.doc.textContent).toBe("bold");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });

  // Runs the input rules as if `text` was typed over the range from `from` to `to`, without a real view
  const runTextInput = (
    content: Array<ProseMirrorNode>,
    from: number,
    to: number,
    text: string,
    ruleSchema: Schema<"doc" | "paragraph", "bold"> = schema,
  ): { dispatch: Mock; handled: boolean } => {
    const plugin = inputRules({
      rules: [new MarkInputRule(boldMatcher, ruleSchema.marks.bold)],
    });
    const state = EditorState.create({
      doc: ruleSchema.nodes.doc.create(
        null,
        ruleSchema.nodes.paragraph.create(null, content),
      ),
      plugins: [plugin],
    });
    const dispatch = vi.fn();
    const handled = plugin.props.handleTextInput?.call(
      plugin,
      { composing: false, dispatch, state } as unknown as EditorView,
      from,
      to,
      text,
      () => state.tr,
    );
    return { dispatch, handled: handled === true };
  };

  test("applies when the typed text reaches into the content", () => {
    // Multi-character input (e.g. from autocorrect) can bring part of the content with it
    const { dispatch, handled } = runTextInput(
      [schema.text("<b>bo", [schema.marks.italic.create()]), schema.text("l")],
      7,
      7,
      "d</b> ",
    );
    const tr = dispatch.mock.calls[0][0] as Transaction;

    expect(handled).toBe(true);
    expect(tr.doc.textContent).toBe("bold ");
    expect(tr.doc.nodeAt(1)?.marks.map((mark) => mark.type.name)).toStrictEqual(
      ["bold", "italic"],
    );
    expect(tr.doc.nodeAt(4)?.marks.map((mark) => mark.type.name)).toStrictEqual(
      ["bold"],
    );
    expect(tr.doc.nodeAt(5)?.marks).toHaveLength(0);
    expect(tr.selection.from).toBe(6);
    expect(tr.storedMarks).toStrictEqual([]);
  });

  test("applies when the whole match is typed at once", () => {
    const { dispatch, handled } = runTextInput([], 1, 1, "<b>bold</b> ");
    const tr = dispatch.mock.calls[0][0] as Transaction;

    expect(handled).toBe(true);
    expect(tr.doc.textContent).toBe("bold ");
    expect(tr.doc.nodeAt(1)?.marks).toHaveLength(1);
    expect(tr.doc.nodeAt(5)?.marks).toHaveLength(0);
    expect(tr.selection.from).toBe(6);
  });

  test("does not apply when the marks of the typed content exclude it", () => {
    const { dispatch, handled } = runTextInput(
      [schema.text("<b>", [schema.marks.exclusive.create()])],
      4,
      4,
      "bold</b> ",
    );

    expect(handled).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("does not apply typed content to a node that disallows the mark", () => {
    const { dispatch, handled } = runTextInput(
      [markLessSchema.text("<b>")],
      4,
      4,
      "bold</b> ",
      markLessSchema,
    );

    expect(handled).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("does not apply when the typed text replaces a selection", () => {
    // "d</b> " replaces the selected "XYZ", so the document doesn't hold the content at the matched positions
    const { dispatch, handled } = runTextInput(
      [schema.text("<b>bolXYZ")],
      7,
      10,
      "d</b> ",
    );

    expect(handled).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("does not apply across an inline node with content", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: [
        schema.text("<b>a"),
        schema.nodes.mention.create(null, schema.text("x")),
        schema.text("b</b>"),
      ],
      ruleOptions: { allowLeafNodes: true },
    });

    expect(testEditor.doc.textContent).toBe("<b>axb</b> ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
  });

  test("does not apply to empty content", () => {
    const testEditor = typeText(schema, boldMatcher, "<b></b> ");

    expect(testEditor.doc.textContent).toBe("<b></b> ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
  });

  test("does not delete a leaf node matched by a delimiter", () => {
    const testEditor = typeText(
      schema,
      /(?<opening>\S?\*)(?<content>[^*]+)(?<closing>\*)(?<trailing>.)$/u,
      " ",
      {
        initialContent: [schema.nodes.hardBreak.create(), schema.text("*a*")],
        ruleOptions: { allowLeafNodes: true },
      },
    );

    expect(testEditor.doc.child(0).child(0).type.name).toBe("hardBreak");
    expect(testEditor.doc.textContent).toBe("*a* ");
  });

  test("does not apply the mark to the trailing text when typing with the mark already active", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: [
        schema.text("<b>bold</b>", [schema.marks.bold.create()]),
      ],
    });

    expect(testEditor.doc.textContent).toBe("bold ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
    expect(testEditor.doc.nodeAt(5)?.marks).toHaveLength(0);
  });

  test("keeps the marks of trailing text already in the document", () => {
    const testEditor = typeText(
      schema,
      /(?<opening><b>)(?<content>.*)(?<closing><\/b>)(?<trailing>.{2})$/u,
      " ",
      {
        initialContent: [
          schema.text("<b>bold</b>"),
          schema.text("x", [schema.marks.bold.create()]),
        ],
      },
    );

    expect(testEditor.doc.textContent).toBe("boldx ");
    expect(testEditor.doc.nodeAt(5)?.marks).toHaveLength(1);
    expect(testEditor.doc.nodeAt(6)?.marks).toHaveLength(0);
    expect(testEditor.state.selection.from).toBe(7);
  });

  test("keeps typing without the mark after re-inserting the trailing text", () => {
    const { dispatch, handled } = runTextInput(
      [schema.text("<b>bold</b>")],
      12,
      12,
      " ",
    );
    const tr = dispatch.mock.calls[0][0] as Transaction;

    expect(handled).toBe(true);
    expect(tr.doc.textContent).toBe("bold ");
    expect(tr.storedMarks).toStrictEqual([]);
    expect(tr.selection.from).toBe(6);
  });

  test("keeps the content when the typed text replaces a selection that overlaps it", () => {
    // "d</b> " replaces the selected "d", which coincides with the last character of the content
    const { dispatch, handled } = runTextInput(
      [schema.text("<b>bold")],
      7,
      8,
      "d</b> ",
    );
    const tr = dispatch.mock.calls[0][0] as Transaction;

    expect(handled).toBe(true);
    expect(tr.doc.textContent).toBe("bold ");
    expect(tr.doc.nodeAt(4)?.marks).toHaveLength(1);
    expect(tr.doc.nodeAt(5)?.marks).toHaveLength(0);
    expect(tr.selection.from).toBe(6);
  });

  test("does not apply when an inline node with content shifts the match", () => {
    // The mention's text is part of the closing delimiter, but its boundaries are not, so the computed start is off by two positions,
    // where the document coincidentally holds the opening delimiter and the content as well.
    const testEditor = typeText(
      schema,
      /(?<opening>a)(?<content>a)(?<closing>a+)(?<trailing> )$/u,
      " ",
      {
        initialContent: [
          schema.text("aaaa"),
          schema.nodes.mention.create(null, schema.text("a")),
        ],
      },
    );

    expect(testEditor.doc.textContent).toBe("aaaaa ");
    expect(testEditor.doc.child(0).child(1).type.name).toBe("mention");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
  });

  test("keeps a leaf node in the trailing text", () => {
    const testEditor = typeText(
      schema,
      /(?<opening><b>)(?<content>[^<]+)(?<closing><\/b>)(?<trailing>[\s\S]{2})$/u,
      "x",
      {
        initialContent: [
          schema.text("<b>bold</b>"),
          schema.nodes.hardBreak.create(),
        ],
      },
    );

    expect(testEditor.doc.textContent).toBe("boldx");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
    expect(testEditor.doc.child(0).child(1).type.name).toBe("hardBreak");
  });

  test("does not apply when an inline node with content in the trailing text shifts the match", () => {
    // As above, but the mention is part of the trailing text
    const testEditor = typeText(
      schema,
      /(?<opening>a)(?<content>a)(?<closing>)(?<trailing>a+ )$/u,
      " ",
      {
        initialContent: [
          schema.text("aaaa"),
          schema.nodes.mention.create(null, schema.text("a")),
        ],
      },
    );

    expect(testEditor.doc.textContent).toBe("aaaaa ");
    expect(testEditor.doc.child(0).child(1).type.name).toBe("mention");
  });

  test("does not apply when a mark on the content excludes it", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: [
        schema.text("<b>a"),
        schema.text("b", [schema.marks.exclusive.create()]),
        schema.text("c</b>"),
      ],
    });

    expect(testEditor.doc.textContent).toBe("<b>abc</b> ");
    expect(testEditor.doc.nodeAt(4)?.marks).toHaveLength(0);
  });

  test("passes the input rule options through", () => {
    const content = [schema.text("<b>bold</b>", [schema.marks.code.create()])];

    expect(
      typeText(schema, boldMatcher, " ", {
        initialContent: content,
        ruleOptions: { inCodeMark: false },
      }).doc.textContent,
    ).toBe("<b>bold</b> ");
    expect(
      typeText(schema, boldMatcher, " ", { initialContent: content }).doc
        .textContent,
    ).toBe("bold ");
  });

  test("can be undone", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: contentWithLeafNode(),
      ruleOptions: { allowLeafNodes: true },
    });

    expect(testEditor.doc.textContent).toBe("ab ");
    expect(testEditor.command(undoInputRule)).toBe(true);
    // The delimiters, the leaf node and the typed text are back, without the mark
    expect(
      testEditor.doc.eq(
        schema.nodes.doc.create(
          null,
          schema.nodes.paragraph.create(null, [
            schema.text("<b>a"),
            schema.nodes.hardBreak.create(),
            schema.text("b</b> "),
          ]),
        ),
      ),
    ).toBe(true);
  });

  test("cannot be undone when not undoable", () => {
    const testEditor = typeText(schema, boldMatcher, " ", {
      initialContent: contentWithLeafNode(),
      ruleOptions: { allowLeafNodes: true, undoable: false },
    });

    expect(testEditor.doc.textContent).toBe("ab ");
    expect(testEditor.command(undoInputRule)).toBe(false);
  });

  test("does not apply a mark the target node disallows", () => {
    const testEditor = typeText(markLessSchema, boldMatcher, "<b>bold</b>!");

    expect(testEditor.doc.textContent).toBe("<b>bold</b>!");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(0);
  });
});
