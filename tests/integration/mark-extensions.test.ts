import { builders } from "prosemirror-test-builder";
import { expect, test, vi } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { BoldExtension, boldSpec } from "./BoldExtension";
import { CodeExtension } from "./CodeExtension";
import { ItalicExtension } from "./ItalicExtension";
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

test("Serializing a mark spanning several nodes", () => {
  const source = "<b>a <i>nested</i> part</b>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            children: [
              { type: "text", value: "a " },
              { children: [{ type: "text", value: "nested" }], type: "italic" },
              { type: "text", value: " part" },
            ],
            type: "bold",
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
    new ItalicExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, doc, italic, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(
    pmu.serialize(doc(paragraph(bold("a ", italic("nested"), " part")))),
  ).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Serializing a mark spanning several nodes around a mark of lower rank", () => {
  const source = "<i>a <b>bold</b> part</i>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            children: [
              { type: "text", value: "a " },
              { children: [{ type: "text", value: "bold" }], type: "bold" },
              { type: "text", value: " part" },
            ],
            type: "italic",
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
    new ItalicExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, doc, italic, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(
    pmu.serialize(doc(paragraph(italic("a ", bold("bold"), " part")))),
  ).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Serializing separate runs of the same mark", () => {
  const source = "<b>a</b> b <b>c <i>d</i></b>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          { children: [{ type: "text", value: "a" }], type: "bold" },
          { type: "text", value: " b " },
          {
            children: [
              { type: "text", value: "c " },
              { children: [{ type: "text", value: "d" }], type: "italic" },
            ],
            type: "bold",
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
    new ItalicExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, doc, italic, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(
    pmu.serialize(doc(paragraph(bold("a"), " b ", bold("c ", italic("d"))))),
  ).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Serializing a leaf mark ranked after a mark around it", () => {
  const source = "<b><code>x</code></b>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [{ children: [{ type: "code", value: "x" }], type: "bold" }],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new BoldExtension(),
    new CodeExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, code, doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(pmu.serialize(doc(paragraph(bold(code("x")))))).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Serializing a leaf mark ranked before a mark around it", () => {
  const source = "<b><code>x</code></b>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [{ children: [{ type: "code", value: "x" }], type: "bold" }],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new CodeExtension(),
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, code, doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(pmu.serialize(doc(paragraph(bold(code("x")))))).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

test("Serializing a mark spanning several nodes around a leaf mark", () => {
  const source = "<b>a <code>b</code></b>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            children: [
              { type: "text", value: "a " },
              { type: "code", value: "b" },
            ],
            type: "bold",
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
    new CodeExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const { bold, code, doc, paragraph } = builders(pmu.schema());

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(pmu.serialize(doc(paragraph(bold("a ", code("b")))))).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);
  expect(console.warn).not.toHaveBeenCalled();
});

/* eslint-enable */
