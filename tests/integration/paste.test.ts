import { builders } from "prosemirror-test-builder";
import { expect, test, vi } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { BoldExtension } from "./BoldExtension";
import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, type UnistRoot } from "./RootExtension";
import { TextExtension } from "./TextExtension";

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

const pastedTree: UnistRoot = {
  children: [
    {
      children: [
        {
          children: [{ type: "text", value: "World" }],
          type: "bold",
        },
        { type: "text", value: "!" },
      ],
      type: "paragraph",
    },
  ],
  type: "root",
};

test("Pasting a single line of text merges it into the current paragraph", () => {
  const parserProvider = new ParserProviderExtension(pastedTree, "");
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { bold, doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection("end");
  testEditor.paste("**World**!\n");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello ", bold("World"), "!")),
  );
  expect(parserProvider.parsed).toStrictEqual(["**World**!"]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Pasting text keeps the marks at the cursor", () => {
  const parserProvider = new ParserProviderExtension(
    {
      children: [
        { children: [{ type: "text", value: "World" }], type: "paragraph" },
      ],
      type: "root",
    } as UnistRoot,
    "",
  );
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { bold, doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph(bold("Hello  !"))), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection(7);
  testEditor.paste("World");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph(bold("Hello World !"))),
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Pasting multiple paragraphs of text", () => {
  const parserProvider = new ParserProviderExtension(
    {
      children: [
        { children: [{ type: "text", value: "One" }], type: "paragraph" },
        { children: [{ type: "text", value: "Two" }], type: "paragraph" },
      ],
      type: "root",
    } as UnistRoot,
    "",
  );
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Start end")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection(7);
  testEditor.paste("One\n\nTwo");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Start One"), paragraph("Twoend")),
  );
  expect(parserProvider.parsed).toStrictEqual(["One\n\nTwo"]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Pasting as plain text keeps the text literal", () => {
  const parserProvider = new ParserProviderExtension(pastedTree, "");
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection("end");
  testEditor.paste({ plainText: true, text: "**World**!" });

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello **World**!")),
  );
  expect(parserProvider.parsed).toStrictEqual([]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Pasting text that fails to convert keeps the text literal", () => {
  const parserProvider = new ParserProviderExtension({ type: "unknown" }, "");
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection("end");
  testEditor.paste("**World**!");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello **World**!")),
  );
  expect(parserProvider.parsed).toStrictEqual(["**World**!"]);
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "unknown" to a ProseMirror node.',
  );
});

test("Pasting text keeps unconvertible inline content as text", () => {
  const parserProvider = new ParserProviderExtension(
    {
      children: [
        {
          children: [
            {
              children: [{ type: "text", value: "World" }],
              position: {
                end: { column: 16, line: 1, offset: 15 },
                start: { column: 1, line: 1, offset: 0 },
              },
              type: "link",
            },
            { type: "text", value: "!" },
          ],
          type: "paragraph",
        },
      ],
      type: "root",
    } as UnistRoot,
    "",
  );
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection("end");
  testEditor.paste("[World](/world)!");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello [World](/world)!")),
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Pasting text with unconvertible block content keeps the text literal", () => {
  const parserProvider = new ParserProviderExtension(
    {
      children: [
        {
          children: [{ type: "text", value: "One" }],
          type: "paragraph",
        },
        {
          children: [{ type: "text", value: "Two" }],
          position: {
            end: { column: 12, line: 3, offset: 16 },
            start: { column: 1, line: 3, offset: 5 },
          },
          type: "link",
        },
      ],
      type: "root",
    } as UnistRoot,
    "",
  );
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: [pmu.pastePlugin()] },
  });
  testEditor.setSelection("end");
  testEditor.paste("One\n\n[Two](/two)!");

  expect(testEditor.doc).toEqualProseMirrorNode(
    doc(paragraph("Hello One"), paragraph("[Two](/two)!")),
  );
  expect(console.warn).not.toHaveBeenCalled();
});

/* eslint-enable */
