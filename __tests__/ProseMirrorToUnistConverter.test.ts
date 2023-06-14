import { mocked } from "jest-mock";
import { Schema } from "prosemirror-model";

import { ExtensionManager } from "../src/ExtensionManager";
import { ProseMirrorToUnistConverter } from "../src/ProseMirrorToUnistConverter";
import { MockNodeExtension } from "./MockNodeExtension";

jest.mock("../src/ExtensionManager");

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
  const rootProseMirrorNode = schema.nodes["doc"].createAndFill({}, [])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    []
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
  const rootProseMirrorNode = schema.nodes["doc"].createAndFill({}, [
    textProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(textExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    textProseMirrorNode,
    []
  );
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [textUnistNode]
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

  const typeThreeExtension = mocked(new MockNodeExtension());
  typeThreeExtension.proseMirrorNodeName.mockReturnValue("typeThree");

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
    typeThreeExtension,
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
      typeThree: {
        group: "groupOne",
      },
      text: {},
    },
  });
  const typeOneProseMirrorNode = schema.nodes["typeOne"].createAndFill({}, [])!;
  const typeTwoProseMirrorNode = schema.nodes["typeTwo"].createAndFill({}, [])!;
  const rootProseMirrorNode = schema.nodes["doc"].createAndFill({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    []
  );
  expect(typeTwoExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeTwoProseMirrorNode,
    []
  );
  expect(typeThreeExtension.proseMirrorNodeToUnistNodes).not.toHaveBeenCalled();
  expect(docExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    rootProseMirrorNode,
    [typeOneUnistNode, typeTwoUnistNode]
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
  const rootNode = schema.nodes["doc"].createAndFill({}, [])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(() => converter.convert(rootNode)).toThrow(
    "Couldn't find any way to convert the root ProseMirror node."
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror node of type "doc" to a unist node.'
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
  const typeOneProseMirrorNode = schema.nodes["typeOne"].createAndFill({}, [])!;
  const typeTwoProseMirrorNode = schema.nodes["typeTwo"].createAndFill({}, [])!;
  const rootProseMirrorNode = schema.nodes["doc"].createAndFill({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ])!;

  jest.spyOn(console, "warn").mockImplementation();
  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
  expect(typeOneExtension.proseMirrorNodeToUnistNodes).toHaveBeenCalledWith(
    typeOneProseMirrorNode,
    []
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert ProseMirror node of type "typeTwo" to a unist node.'
  );
});
