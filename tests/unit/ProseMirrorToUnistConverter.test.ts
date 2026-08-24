import type { Node as UnistNode } from "unist";

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
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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
  textExtension.proseMirrorNodeName.mockReturnValue("text");
  const textUnistNode = { type: "text", value: "Hello World!" };
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    textUnistNode,
  ]);

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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
  textExtension.proseMirrorNodeName.mockReturnValue("text");
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
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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

  expect(() => converter.convert(rootNode)).toThrow(
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
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
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

test("Warns when multiple extensions can convert a node", () => {
  expect.assertions(6);

  class DocExtension1<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}
  class DocExtension2<
    UNode extends UnistNode,
  > extends MockNodeExtension<UNode> {}

  const textUnistNode = { type: "text", value: "Hello World!" };
  const firstRootUnistNode = { children: [textUnistNode], type: "first" };
  const secondRootUnistNode = { children: [textUnistNode], type: "second" };

  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValue("text");
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValue([textUnistNode]);

  const extension1 = vi.mocked(new DocExtension1());
  extension1.proseMirrorNodeName.mockReturnValue("doc");
  extension1.proseMirrorNodeToUnistNodes.mockReturnValue([firstRootUnistNode]);

  const extension2 = vi.mocked(new DocExtension2());
  extension2.proseMirrorNodeName.mockReturnValue("doc");
  extension2.proseMirrorNodeToUnistNodes.mockReturnValue([secondRootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValue([
    extension1,
    extension2,
    textExtension,
  ]);
  manager.markExtensions.mockReturnValue([]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    schema.text("Hello World!"),
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  const converted = converter.convert(rootProseMirrorNode);

  // The first matching extension wins.
  expect(converted).toStrictEqual(firstRootUnistNode);
  expect(extension1.proseMirrorNodeToUnistNodes).toHaveBeenCalledTimes(1);
  expect(extension2.proseMirrorNodeToUnistNodes).not.toHaveBeenCalled();
  // The children are only converted once, not once per matching extension.
  expect(textExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenCalledWith(
    'Multiple extensions (DocExtension1, DocExtension2) can convert the ProseMirror node of type "doc" to a unist node, using DocExtension1.',
  );
});

test("Warns when multiple extensions can convert a mark", () => {
  expect.assertions(5);

  class MarkExtension1<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}
  class MarkExtension2<
    UNode extends UnistNode,
  > extends MockMarkExtension<UNode> {}

  const textUnistNode = { type: "text", value: "Hello World!" };
  const markedUnistNode = { marked: true, type: "text" };
  const rootUnistNode = { children: [markedUnistNode], type: "root" };

  const textExtension = vi.mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValue("text");
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValue([textUnistNode]);

  const extension1 = vi.mocked(new MarkExtension1());
  extension1.proseMirrorMarkName.mockReturnValue("mark");
  extension1.processConvertedUnistNode.mockReturnValue(markedUnistNode);

  const extension2 = vi.mocked(new MarkExtension2());
  extension2.proseMirrorMarkName.mockReturnValue("mark");

  const docExtension = vi.mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValue("doc");
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValue([rootUnistNode]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValue([extension1, extension2]);
  manager.nodeExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    marks: { mark: {} },
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.create({}, [
    schema.text("Hello World!").mark([schema.marks.mark.create()]),
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  const converted = converter.convert(rootProseMirrorNode);

  // The first matching extension wins.
  expect(converted).toStrictEqual(rootUnistNode);
  expect(extension1.processConvertedUnistNode).toHaveBeenCalledTimes(1);
  expect(extension2.processConvertedUnistNode).not.toHaveBeenCalled();
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenCalledWith(
    'Multiple extensions (MarkExtension1, MarkExtension2) can convert the ProseMirror mark of type "mark" to a unist node, using MarkExtension1.',
  );
});

/* eslint-enable */
