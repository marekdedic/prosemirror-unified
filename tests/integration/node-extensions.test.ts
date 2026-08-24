import { expect, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with a paragraph", () => {
  expect.assertions(11);

  const source = "<p>Hello World!</p>";
  const unistTree: UnistRoot = {
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

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([
    parserProvider,
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
        .nodes["paragraph"].createAndFill(
          {},
          pmu.schema().text("Hello World!"),
        ),
    );

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
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

test("Parsing a document with no root node", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(
    () =>
      new ProseMirrorUnified([new TextExtension(), new ParagraphExtension()]),
  ).toThrow("Schema is missing its top node type ('doc')");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Parsing a document with no text node", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(
    () =>
      new ProseMirrorUnified([new ParagraphExtension(), new RootExtension()]),
  ).toThrow("Every schema needs a 'text' type");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Parsing a document with no link node", () => {
  expect.assertions(11);

  const source = "<p>Hello <a>World</a>!</p>";
  const target = "<p>Hello !</p>";
  const sourceUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            children: [{ type: "text", value: "World" }],
            type: "link",
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
  const targetUnistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello !",
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
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const targetProseMirrorTree = pmu
    .schema()
    .nodes["doc"].create(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello !")),
    );

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const proseMirrorRoot = pmu.parse(source);
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(targetProseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(parserProvider.stringified).toStrictEqual([targetUnistTree]);

  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "link" to a ProseMirror node.',
  );
});

/* eslint-enable */
