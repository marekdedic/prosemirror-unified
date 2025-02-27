import type { Node as UnistNode } from "unist";

import { type Processor, unified } from "unified";
import { expect, type Mocked, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { BoldExtension, boldSpec } from "./BoldExtension";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

vi.mock("unified");

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with a paragraph", () => {
  expect.assertions(14);

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

  const unifiedMock = {
    parse: vi.fn<(file: string) => UnistNode>().mockReturnValueOnce(unistTree),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockImplementation((root) => root),
    stringify: vi.fn<(tree: UnistNode) => string>().mockReturnValueOnce(source),
  } as unknown as Mocked<Processor>;

  vi.mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const proseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, [pmu.schema().text("Hello "), pmu.schema().text("World").mark([pmu.schema().marks["bold"].create()]), pmu.schema().text("!")]));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(1);
  expect(testEditor.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
  expect(unifiedMock.parse).toHaveBeenCalledWith(source);
  expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

  expect(pmu.serialize(testEditor.doc)).toBe(source);

  expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
  expect(unifiedMock.stringify).toHaveBeenCalledWith(unistTree);

  expect(console.warn).not.toHaveBeenCalled();
});

test("Adding a mark with an input rule", () => {
  expect.assertions(14);

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

  const unifiedMock = {
    parse: vi
      .fn<(file: string) => UnistNode>()
      .mockReturnValueOnce(sourceUnistTree),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockImplementation((root) => root),
    stringify: vi.fn<(tree: UnistNode) => string>().mockReturnValueOnce(target),
  } as unknown as Mocked<Processor>;

  vi.mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const proseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, [pmu.schema().text("Hello "), pmu.schema().text("World").mark([pmu.schema().marks["bold"].create()]), pmu.schema().text("!")]));

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
  expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
  expect(unifiedMock.parse).toHaveBeenCalledWith(source);
  expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
  expect(unifiedMock.stringify).toHaveBeenCalledWith(targetUnistTree);

  expect(console.warn).not.toHaveBeenCalled();
});

test("Adding a mark with a key binding", () => {
  expect.assertions(13);

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

  const unifiedMock = {
    parse: vi
      .fn<(file: string) => UnistNode>()
      .mockReturnValueOnce(sourceUnistTree),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockImplementation((root) => root),
    stringify: vi.fn<(tree: UnistNode) => string>().mockReturnValueOnce(target),
  } as unknown as Mocked<Processor>;

  vi.mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const proseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, [pmu.schema().text("Hello "), pmu.schema().text("World").mark([pmu.schema().marks["bold"].create()]), pmu.schema().text("!")]));

  const testEditor = new ProseMirrorTester(proseMirrorRoot, {
    plugins: [pmu.keymapPlugin()],
  });
  testEditor.selectText({ from: 7, to: 12 });
  testEditor.shortcut("Mod-b");

  expect(testEditor.schema.spec.marks.size).toBe(1);
  expect(testEditor.schema.spec.marks.get("bold")).toBe(boldSpec);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
  expect(unifiedMock.parse).toHaveBeenCalledWith(source);
  expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
  expect(unifiedMock.stringify).toHaveBeenCalledWith(targetUnistTree);
});

/* eslint-enable */
