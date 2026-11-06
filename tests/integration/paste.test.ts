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

test("Pasting text that fails to parse keeps the text literal", () => {
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

/* eslint-enable */
