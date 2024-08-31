import { mocked } from "jest-mock";
import { Schema } from "prosemirror-model";

import { ExtensionManager } from "../../src/ExtensionManager";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";
import { MockSyntaxExtension } from "../mocks/MockSyntaxExtension";

jest.mock("../../src/ExtensionManager");
jest.mock("../../src/SyntaxExtension");

test("Converts basic document", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [])!;

  const docExtension = mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockReturnValueOnce(true);
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = { type: "root", children: [] };

  jest.spyOn(console, "warn").mockImplementation();

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);
  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children", () => {
  const schema = new Schema<string, string>({
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

  const textExtension = mocked(new MockSyntaxExtension());
  textExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "text",
  );
  textExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    textProseMirrorNode,
  ]);

  const docExtension = mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const textUnistNode = { type: "text", value: "Hello World!" };
  const rootUnistNode = { type: "root", children: [textUnistNode] };

  jest.spyOn(console, "warn").mockImplementation();

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);
  expect(textExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    textUnistNode,
  );
  expect(textExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    textUnistNode,
    schema,
    [],
    {},
  );
  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [textProseMirrorNode],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children of multiple types", () => {
  const schema = new Schema<string, string>({
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

  const typeOneExtension = mocked(new MockSyntaxExtension());
  typeOneExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "one",
  );
  typeOneExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeOneProseMirrorNode,
  ]);

  const typeTwoExtension = mocked(new MockSyntaxExtension());
  typeTwoExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "two",
  );
  typeTwoExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeTwoProseMirrorNode,
  ]);

  const typeThreeExtension = mocked(new MockSyntaxExtension());
  typeThreeExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "three",
  );

  const docExtension = mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([
    docExtension,
    typeOneExtension,
    typeTwoExtension,
    typeThreeExtension,
  ]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const typeOneUnistNode = { type: "one" };
  const typeTwoUnistNode = { type: "two" };
  const rootUnistNode = {
    type: "root",
    children: [typeOneUnistNode, typeTwoUnistNode],
  };

  jest.spyOn(console, "warn").mockImplementation();

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);

  expect(typeOneExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeOneUnistNode,
  );
  expect(typeOneExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeOneUnistNode,
    schema,
    [],
    {},
  );

  expect(typeTwoExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeTwoUnistNode,
  );
  expect(typeTwoExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeTwoUnistNode,
    schema,
    [],
    {},
  );

  expect(typeThreeExtension.unistNodeToProseMirrorNodes).not.toHaveBeenCalled();

  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [typeOneProseMirrorNode, typeTwoProseMirrorNode],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Fails gracefully on no root converter", () => {
  const manager = mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([]);

  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = { type: "root", children: [] };

  jest.spyOn(console, "warn").mockImplementation();

  expect(() => converter.convert(rootUnistNode)).toThrow(
    "Couldn't find any way to convert the root unist node.",
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "root" to a ProseMirror node.',
  );
});

test("Converts a document with invalid children", () => {
  const schema = new Schema<string, string>({
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

  const typeOneExtension = mocked(new MockSyntaxExtension());
  typeOneExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "one",
  );
  typeOneExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeOneProseMirrorNode,
  ]);

  const docExtension = mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const typeOneUnistNode = { type: "one" };
  const typeTwoUnistNode = { type: "two" };
  const rootUnistNode = {
    type: "root",
    children: [typeOneUnistNode, typeTwoUnistNode],
  };

  jest.spyOn(console, "warn").mockImplementation();

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);

  expect(typeOneExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeOneUnistNode,
  );
  expect(typeOneExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeOneUnistNode,
    schema,
    [],
    {},
  );

  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [typeOneProseMirrorNode],
    {},
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "two" to a ProseMirror node.',
  );
});
