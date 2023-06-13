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

  expect(converter.convert(rootProseMirrorNode)).toStrictEqual(rootUnistNode);
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
