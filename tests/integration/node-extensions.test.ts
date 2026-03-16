import type { Node as UnistNode } from "unist";

import { type Processor, unified } from "unified";
import { expect, type Mocked, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

vi.mock("unified");

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with a paragraph", () => {
  expect.assertions(13);

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

  const unifiedMock = {
    parse: vi.fn<(file: string) => UnistNode>().mockReturnValueOnce(unistTree),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockImplementation((root) => root),
    stringify: vi.fn<(tree: UnistNode) => string>().mockReturnValueOnce(source),
  } as unknown as Mocked<Processor>;

  vi.mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source);

  const proseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello World!")));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
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
  expect.assertions(13);

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
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const targetProseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello !")));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const proseMirrorRoot = pmu.parse(source);
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(targetProseMirrorTree);
  expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
  expect(unifiedMock.parse).toHaveBeenCalledWith(source);
  expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

  expect(pmu.serialize(testEditor.doc)).toBe(target);

  expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
  expect(unifiedMock.stringify).toHaveBeenCalledWith(targetUnistTree);

  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "link" to a ProseMirror node.',
  );
});

/* eslint-enable */
