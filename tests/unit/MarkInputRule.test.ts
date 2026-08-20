import { inputRules } from "prosemirror-inputrules";
import { type DOMOutputSpec, Schema } from "prosemirror-model";
import { describe, expect, test } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { MarkInputRule } from "../../src/MarkInputRule";

describe("MarkInputRule works", () => {
  const errorMessage =
    'A MarkInputRule matcher must contain the named capturing groups "content" and "trailing".';

  const schema = new Schema({
    marks: {
      bold: { toDOM: (): DOMOutputSpec => ["b", 0] },
    },
    nodes: {
      doc: { content: "paragraph+" },
      paragraph: { content: "text*", toDOM: (): DOMOutputSpec => ["p", 0] },
      text: {},
    },
  });

  const typeText = (matcher: RegExp, text: string): ProseMirrorTester => {
    const testEditor = new ProseMirrorTester(
      schema.nodes.doc.create(null, schema.nodes.paragraph.create()),
      {
        plugins: [
          inputRules({
            rules: [new MarkInputRule(matcher, schema.marks.bold)],
          }),
        ],
      },
    );

    testEditor.selectText("end");
    testEditor.insertText(text);

    return testEditor;
  };

  test("throws when the matcher is missing both named groups", () => {
    expect.assertions(1);

    expect(
      () => new MarkInputRule(/<b>(.*)<\/b>(.)$/u, schema.marks.bold),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the content group", () => {
    expect.assertions(1);

    expect(
      () =>
        new MarkInputRule(/<b>(.*)<\/b>(?<trailing>.)$/u, schema.marks.bold),
    ).toThrow(errorMessage);
  });

  test("throws when the matcher is missing the trailing group", () => {
    expect.assertions(1);

    expect(
      () => new MarkInputRule(/<b>(?<content>.*)<\/b>(.)$/u, schema.marks.bold),
    ).toThrow(errorMessage);
  });

  test("throws when a named group is misspelled", () => {
    expect.assertions(1);

    expect(
      () =>
        new MarkInputRule(
          /<b>(?<content>.*)<\/b>(?<trailng>.)?$/u,
          schema.marks.bold,
        ),
    ).toThrow(errorMessage);
  });

  test("strips the delimiters and applies the mark", () => {
    expect.assertions(3);

    const testEditor = typeText(
      /<b>(?<content>.*)<\/b>(?<trailing>.)$/u,
      "<b>bold</b> ",
    );

    expect(testEditor.doc.textContent).toBe("bold ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
    expect(testEditor.doc.nodeAt(1)?.marks[0].type.name).toBe("bold");
  });

  test("works regardless of the capturing group indices", () => {
    expect.assertions(2);

    // The content group sits at index 2, after the backreferenced delimiter
    const testEditor = typeText(
      /(?<delimiter>`+)(?<content>[^`]+)\k<delimiter>(?<trailing>.)$/u,
      "``code`` ",
    );

    expect(testEditor.doc.textContent).toBe("code ");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });

  test("re-inserts a multi-character trailing match", () => {
    expect.assertions(1);

    expect(
      typeText(/<b>(?<content>.*)<\/b>(?<trailing>\s\s)$/u, "<b>bold</b>  ").doc
        .textContent,
    ).toBe("bold  ");
  });

  test("works with an optional trailing group that does not match", () => {
    expect.assertions(2);

    const testEditor = typeText(
      /<b>(?<content>.*)<\/b>(?<trailing>.)?$/u,
      "<b>bold</b>",
    );

    expect(testEditor.doc.textContent).toBe("bold");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });

  test("works with a matcher that has no trailing text at all", () => {
    expect.assertions(2);

    const testEditor = typeText(
      /<b>(?<content>.*)<\/b>(?<trailing>)?$/u,
      "<b>bold</b>",
    );

    expect(testEditor.doc.textContent).toBe("bold");
    expect(testEditor.doc.nodeAt(1)?.marks).toHaveLength(1);
  });
});
