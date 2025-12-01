import { Schema } from "prosemirror-model";
import { expect, test, vi } from "vitest";

import { ExtensionManager } from "../../src/ExtensionManager";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

vi.mock("../../src/ExtensionManager");
vi.mock("../../src/MarkExtension");

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Console output testing */

test("Converts basic document", () => {
  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = { children: [], type: "root" };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValueOnce([docExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.create({}, []);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children", () => {
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  const textUnistNode = { type: "text", value: "Hello World!" };
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    textUnistNode,
  ]);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = { children: [textUnistNode], type: "root" };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "text*",
      },
      text: {},
    },
  });
  const textProseMirrorNode = schema.text("Hello World!");
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    textProseMirrorNode,
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(textExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    textProseMirrorNode,
    [],
  );
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [textUnistNode],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children of multiple types", () => {
  const typeOneExtension = vi.mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const typeTwoExtension = vi.mocked(new MockNodeExtension());
  typeTwoExtension.proseMirrorNodeName.mockReturnValue("typeTwo");
  const typeTwoUnistNode = { type: "two" };
  typeTwoExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeTwoUnistNode,
  ]);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    children: [typeOneUnistNode, typeTwoUnistNode],
    type: "root",
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValue([
    docExtension,
    typeOneExtension,
    typeTwoExtension,
  ]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      text: {},
      typeOne: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne.create({}, []);
  const typeTwoProseMirrorNode = schema.nodes.typeTwo.create({}, []);
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    [],
  );
  expect(typeTwoExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeTwoProseMirrorNode,
    [],
  );
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [typeOneUnistNode, typeTwoUnistNode],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with marks", () => {
  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  const textUnistNode = { type: "text", value: "Hello World!" };
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    textUnistNode,
  ]);

  const markOneExtension = vi.mocked(new MockMarkExtension());
  markOneExtension.proseMirrorMarkName.mockReturnValue("markOne");
  const bothMarksUnistNode = {
    markOne: true,
    markTwo: true,
    type: "text",
    value: "Hello World!",
  };
  markOneExtension.processConvertedUnistNode.mockReturnValueOnce(
    bothMarksUnistNode,
  );

  const markTwoExtension = vi.mocked(new MockMarkExtension());
  markTwoExtension.proseMirrorMarkName.mockReturnValue("markTwo");
  const markTwoUnistNode = {
    markTwo: true,
    type: "text",
    value: "Hello World!",
  };
  markTwoExtension.processConvertedUnistNode.mockReturnValueOnce(
    markTwoUnistNode,
  );

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    children: [textUnistNode],
    type: "root",
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValue([markOneExtension, markTwoExtension]);
  manager.nodeExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    marks: {
      markOne: {},
      markTwo: {},
    },
    nodes: {
      doc: {
        content: "text*",
      },
      text: {},
    },
  });
  const textProseMirrorNode = schema
    .text("Hello World!")
    .mark([schema.marks.markTwo.create(), schema.marks.markOne.create()]);
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    textProseMirrorNode,
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(textExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    textProseMirrorNode,
    [],
  );

  expect(markOneExtension.proseMirrorMarkName.mock.calls).toHaveLength(2);
  expect(markOneExtension.processConvertedUnistNode).toHaveBeenCalledWith(
    markTwoUnistNode,
    textProseMirrorNode.marks[1],
  );

  expect(markTwoExtension.proseMirrorMarkName.mock.calls).toHaveLength(2);
  expect(markTwoExtension.processConvertedUnistNode).toHaveBeenCalledWith(
    textUnistNode,
    textProseMirrorNode.marks[0],
  );

  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [bothMarksUnistNode],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Fails gracefully on no root converter", () => {
  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValueOnce([]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootNode = schema.nodes.doc.create({}, []);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(() => converter.convert(rootNode)).toThrowError(
    "Couldn't find any way to convert the root ProseMirror node.",
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror node of type "doc" to a unist node.',
  );
});

test("Converts a document with invalid children", () => {
  const typeOneExtension = vi.mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    children: [typeOneUnistNode],
    type: "root",
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      text: {},
      typeOne: {
        group: "groupOne",
      },
      typeThree: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne.create({}, []);
  const typeTwoProseMirrorNode = schema.nodes.typeTwo.create({}, []);
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    [],
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror node of type "typeTwo" to a unist node.',
  );
});

test("Converts a document with invalid marks", () => {
  const typeOneExtension = vi.mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    children: [typeOneUnistNode],
    type: "root",
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValue([]);
  manager.nodeExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    marks: {
      typeTwo: {},
    },
    nodes: {
      doc: {
        content: "groupOne*",
      },
      text: {},
      typeOne: {
        group: "groupOne",
      },
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne
    .create({}, [])
    .mark([schema.marks.typeTwo.create()]);
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    typeOneProseMirrorNode,
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    [],
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror mark of type "typeTwo" to a unist node.',
  );
});

/* eslint-enable */
