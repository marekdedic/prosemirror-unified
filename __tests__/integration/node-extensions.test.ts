import type { Mocked } from "jest-mock";
import { mocked } from "jest-mock";
import { createEditor } from "jest-prosemirror";
import { type Processor, unified } from "unified";
import type { Node as UnistNode } from "unist";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

jest.mock("unified");

test("Parsing a document with a paragraph", () => {
  expect.assertions(13);

  const source = "<p>Hello World!</p>";
  const unistTree: UnistRoot = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "Hello World!",
          },
        ],
      },
    ],
  };

  const unifiedMock = {
    parse: jest.fn().mockReturnValueOnce(unistTree),
    runSync: jest.fn().mockImplementation((root: UnistRoot) => root),
    stringify: jest.fn().mockReturnValueOnce(source),
  } as unknown as Mocked<Processor<UnistNode, UnistNode, UnistNode, string>>;

  mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source)!;

  const proseMirrorTree = pmu
    .schema()
    .nodes["doc"].createAndFill(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello World!"))
    )!;

  jest.spyOn(console, "warn").mockImplementation();
  createEditor(proseMirrorRoot).callback((content) => {
    expect(content.schema.spec.marks.size).toBe(0);
    expect(content.schema.spec.nodes.size).toBe(3);
    expect(content.schema.spec.nodes.get("doc")).toBe(rootSpec);
    expect(content.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
    expect(content.schema.spec.nodes.get("text")).toBe(textSpec);
    expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
    expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
    expect(unifiedMock.parse).toHaveBeenCalledWith(source);
    expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

    expect(pmu.serialize(content.doc)).toBe(source);

    expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
    expect(unifiedMock.stringify).toHaveBeenCalledWith(unistTree);
  });
  expect(console.warn).not.toHaveBeenCalled();
});

test("Parsing a document with no root node", () => {
  jest.spyOn(console, "warn").mockImplementation();

  expect(
    () =>
      new ProseMirrorUnified([new TextExtension(), new ParagraphExtension()])
  ).toThrow("Schema is missing its top node type ('doc')");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Parsing a document with no text node", () => {
  jest.spyOn(console, "warn").mockImplementation();

  expect(
    () =>
      new ProseMirrorUnified([new ParagraphExtension(), new RootExtension()])
  ).toThrow("Every schema needs a 'text' type");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Parsing a document with no link node", () => {
  expect.assertions(13);

  const source = "<p>Hello <a>World</a>!</p>";
  const target = "<p>Hello !</p>";
  const sourceUnistTree: UnistRoot = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            type: "link",
            children: [{ type: "text", value: "World" }],
          },
          {
            type: "text",
            value: "!",
          },
        ],
      },
    ],
  };
  const targetUnistTree: UnistRoot = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "Hello !",
          },
        ],
      },
    ],
  };

  const unifiedMock = {
    parse: jest.fn().mockReturnValueOnce(sourceUnistTree),
    runSync: jest.fn().mockImplementation((root: UnistRoot) => root),
    stringify: jest.fn().mockReturnValueOnce(target),
  } as unknown as Mocked<Processor<UnistNode, UnistNode, UnistNode, string>>;

  mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const targetProseMirrorTree = pmu
    .schema()
    .nodes["doc"].createAndFill(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello !"))
    )!;

  jest.spyOn(console, "warn").mockImplementation();
  const proseMirrorRoot = pmu.parse(source)!;
  createEditor(proseMirrorRoot).callback((content) => {
    expect(content.schema.spec.marks.size).toBe(0);
    expect(content.schema.spec.nodes.size).toBe(3);
    expect(content.schema.spec.nodes.get("doc")).toBe(rootSpec);
    expect(content.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
    expect(content.schema.spec.nodes.get("text")).toBe(textSpec);
    expect(content.doc).toEqualProsemirrorNode(targetProseMirrorTree);
    expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
    expect(unifiedMock.parse).toHaveBeenCalledWith(source);
    expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

    expect(pmu.serialize(content.doc)).toBe(target);

    expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
    expect(unifiedMock.stringify).toHaveBeenCalledWith(targetUnistTree);
  });
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "link" to a ProseMirror node.'
  );
});
