import { expect, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

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

  const proseMirrorTree = pmu
    .schema()
    .nodes["doc"].create(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, [
          pmu.schema().text("Hello "),
          pmu
            .schema()
            .text("World")
            .mark([pmu.schema().marks["bold"].create()]),
          pmu.schema().text("!"),
        ]),
    );

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(1);
  expect(testEditor.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
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

  const proseMirrorTree = pmu
    .schema()
    .nodes["doc"].create(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, [
          pmu.schema().text("Hello "),
          pmu
            .schema()
            .text("World")
            .mark([pmu.schema().marks["bold"].create()]),
          pmu.schema().text("!"),
        ]),
    );

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = new ProseMirrorTester(proseMirrorRoot, {
    plugins: [pmu.inputRulesPlugin()],
  });
  testEditor.selectText("end");
  testEditor.insertText("<b>World</b>!");

  expect(testEditor.schema.spec.marks.size).toBe(1);
  expect(testEditor.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
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

  const proseMirrorTree = pmu
    .schema()
    .nodes["doc"].create(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, [
          pmu.schema().text("Hello "),
          pmu
            .schema()
            .text("World")
            .mark([pmu.schema().marks["bold"].create()]),
          pmu.schema().text("!"),
        ]),
    );

  const testEditor = new ProseMirrorTester(proseMirrorRoot, {
    plugins: [pmu.keymapPlugin()],
  });
  testEditor.selectText({ from: 7, to: 12 });
  testEditor.insertText("b", { ctrlKey: true });

  expect(testEditor.schema.spec.marks.size).toBe(1);
  expect(testEditor.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(parserProvider.stringified).toStrictEqual([targetUnistTree]);
});

/* eslint-enable */
