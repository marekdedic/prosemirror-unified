import { builders } from "prosemirror-test-builder";
import { expect, test, vi } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { BoldExtension, boldSpec } from "./BoldExtension";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with a paragraph", () => {
  expect.assertions(12);

  const source = "Hello <b>World</b>!";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            children: [
              {
                type: "text",
                value: "World",
              },
            ],
            type: "bold",
          },
          {
            type: "text",
            value: "!",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const { bold, doc, paragraph } = builders(pmu.schema());
  const proseMirrorTree = doc(paragraph("Hello ", bold("World"), "!"));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(proseMirrorRoot);

  expect(testEditor.state.schema.spec.marks.size).toBe(1);
  expect(testEditor.state.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.state.schema.spec.nodes.size).toBe(3);
  expect(testEditor.state.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.state.schema.spec.nodes.get("paragraph")).toBe(
    paragraphSpec,
  );
  expect(testEditor.state.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(source);

  expect(parserProvider.stringified).toStrictEqual([unistTree]);

  expect(console.warn).not.toHaveBeenCalled();
});

test("Adding a mark with an input rule", () => {
  expect.assertions(12);

  const source = "Hello ";
  const target = "Hello <b>World</b>!";
  const sourceUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello ",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };
  const targetUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            children: [
              {
                type: "text",
                value: "World",
              },
            ],
            type: "bold",
          },
          {
            type: "text",
            value: "!",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(sourceUnistTree, target);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const { bold, doc, paragraph } = builders(pmu.schema());
  const proseMirrorTree = doc(paragraph("Hello ", bold("World"), "!"));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = renderProseMirror(proseMirrorRoot, {
    editorProps: {
      plugins: [pmu.inputRulesPlugin()],
    },
  });
  testEditor.setSelection("end");
  testEditor.type("<b>World</b>!");

  expect(testEditor.state.schema.spec.marks.size).toBe(1);
  expect(testEditor.state.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.state.schema.spec.nodes.size).toBe(3);
  expect(testEditor.state.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.state.schema.spec.nodes.get("paragraph")).toBe(
    paragraphSpec,
  );
  expect(testEditor.state.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(parserProvider.stringified).toStrictEqual([targetUnistTree]);

  expect(console.warn).not.toHaveBeenCalled();
});

test("Adding a mark with a key binding", () => {
  expect.assertions(11);

  const source = "Hello World!";
  const target = "Hello <b>World</b>!";
  const sourceUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello World!",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };
  const targetUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            children: [
              {
                type: "text",
                value: "World",
              },
            ],
            type: "bold",
          },
          {
            type: "text",
            value: "!",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(sourceUnistTree, target);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const { bold, doc, paragraph } = builders(pmu.schema());
  const proseMirrorTree = doc(paragraph("Hello ", bold("World"), "!"));

  const testEditor = renderProseMirror(proseMirrorRoot, {
    editorProps: {
      plugins: [pmu.keymapPlugin()],
    },
  });
  testEditor.setSelection({ anchor: 7, head: 12 });
  testEditor.type("{Mod-b}");

  expect(testEditor.state.schema.spec.marks.size).toBe(1);
  expect(testEditor.state.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.state.schema.spec.nodes.size).toBe(3);
  expect(testEditor.state.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.state.schema.spec.nodes.get("paragraph")).toBe(
    paragraphSpec,
  );
  expect(testEditor.state.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(parserProvider.stringified).toStrictEqual([targetUnistTree]);
});

/* eslint-enable */
