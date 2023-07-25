import { mocked } from "jest-mock";
import { Schema } from "prosemirror-model";

import { ExtensionManager } from "../../src/ExtensionManager";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

jest.mock("../../src/ExtensionManager");
jest.mock("../../src/MarkExtension");

test("Converts basic document", () => {
  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = { type: "root", children: [] };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValueOnce([docExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children", () => {
  const textExtension = mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  const textUnistNode = { type: "text", value: "Hello World!" };
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    textUnistNode,
  ]);

  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = { type: "root", children: [textUnistNode] };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
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
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [
    textProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
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
  const typeOneExtension = mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const typeTwoExtension = mocked(new MockNodeExtension());
  typeTwoExtension.proseMirrorNodeName.mockReturnValue("typeTwo");
  const typeTwoUnistNode = { type: "two" };
  typeTwoExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeTwoUnistNode,
  ]);

  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    type: "root",
    children: [typeOneUnistNode, typeTwoUnistNode],
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
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
      typeOne: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
      text: {},
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne.createAndFill({}, [])!;
  const typeTwoProseMirrorNode = schema.nodes.typeTwo.createAndFill({}, [])!;
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
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
  const textExtension = mocked(new MockNodeExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  const textUnistNode = { type: "text", value: "Hello World!" };
  textExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    textUnistNode,
  ]);

  const markOneExtension = mocked(new MockMarkExtension());
  markOneExtension.proseMirrorToUnistTest
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  const bothMarksUnistNode = {
    type: "text",
    value: "Hello World!",
    markOne: true,
    markTwo: true,
  };
  markOneExtension.processConvertedUnistNode.mockReturnValueOnce(
    bothMarksUnistNode,
  );

  const markTwoExtension = mocked(new MockMarkExtension());
  markTwoExtension.proseMirrorToUnistTest
    .mockReturnValueOnce(true)
    .mockReturnValueOnce(false);
  const markTwoUnistNode = {
    type: "text",
    value: "Hello World!",
    markTwo: true,
  };
  markTwoExtension.processConvertedUnistNode.mockReturnValueOnce(
    markTwoUnistNode,
  );

  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    type: "root",
    children: [textUnistNode],
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValue([markOneExtension, markTwoExtension]);
  manager.nodeExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "text*",
      },
      text: {},
    },
    marks: {
      markOne: {},
      markTwo: {},
    },
  });
  const textProseMirrorNode = schema
    .text("Hello World!")
    .mark([schema.marks.markTwo.create(), schema.marks.markOne.create()]);
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [
    textProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(textExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    textProseMirrorNode,
    [],
  );

  expect(markOneExtension.proseMirrorToUnistTest.mock.calls).toHaveLength(2);
  expect(markOneExtension.proseMirrorToUnistTest).toHaveBeenCalledWith(
    textUnistNode,
    textProseMirrorNode.marks[0],
  );
  expect(markOneExtension.proseMirrorToUnistTest).toHaveBeenCalledWith(
    markTwoUnistNode,
    textProseMirrorNode.marks[1],
  );
  expect(markOneExtension.processConvertedUnistNode).toHaveBeenCalledWith(
    markTwoUnistNode,
    textProseMirrorNode.marks[1],
  );

  expect(markTwoExtension.proseMirrorToUnistTest.mock.calls).toHaveLength(2);
  expect(markTwoExtension.proseMirrorToUnistTest).toHaveBeenCalledWith(
    textUnistNode,
    textProseMirrorNode.marks[0],
  );
  expect(markTwoExtension.proseMirrorToUnistTest).toHaveBeenCalledWith(
    bothMarksUnistNode,
    textProseMirrorNode.marks[1],
  );
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
  const manager = mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValueOnce([]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootNode = schema.nodes.doc.createAndFill({}, [])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(() => converter.convert(rootNode)).toThrow(
    "Couldn't find any way to convert the root ProseMirror node.",
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror node of type "doc" to a unist node.',
  );
});

test("Converts a document with invalid children", () => {
  const typeOneExtension = mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    type: "root",
    children: [typeOneUnistNode],
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      typeOne: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
      typeThree: {
        group: "groupOne",
      },
      text: {},
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne.createAndFill({}, [])!;
  const typeTwoProseMirrorNode = schema.nodes.typeTwo.createAndFill({}, [])!;
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
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
  const typeOneExtension = mocked(new MockNodeExtension());
  typeOneExtension.proseMirrorNodeName.mockReturnValue("typeOne");
  const typeOneUnistNode = { type: "one" };
  typeOneExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([
    typeOneUnistNode,
  ]);

  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  const rootUnistNode = {
    type: "root",
    children: [typeOneUnistNode],
  };
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([rootUnistNode]);

  const manager = mocked(new ExtensionManager([]));
  manager.markExtensions.mockReturnValue([]);
  manager.nodeExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      typeOne: {
        group: "groupOne",
      },
      text: {},
    },
    marks: {
      typeTwo: {},
    },
  });
  const typeOneProseMirrorNode = schema.nodes.typeOne
    .createAndFill({}, [])!
    .mark([schema.marks.typeTwo.create()]);
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [
    typeOneProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    [],
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror mark of type "typeTwo" to a unist node.',
  );
});
