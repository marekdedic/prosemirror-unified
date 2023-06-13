import { mocked } from "jest-mock";
import { Schema } from "prosemirror-model";

import { ExtensionManager } from "../src/ExtensionManager";
import { ProseMirrorToUnistConverter } from "../src/ProseMirrorToUnistConverter";
import { MockNodeExtension } from "./MockNodeExtension";

jest.mock("../src/ExtensionManager");

test("Converts basic document", () => {
  const docExtension = mocked(new MockNodeExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeToUnistNodes.mockReturnValueOnce([]);

  const manager = mocked(new ExtensionManager([]));
  manager.nodeExtensions.mockReturnValueOnce([docExtension]);

  const converter = new ProseMirrorToUnistConverter(manager);

  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootNode = schema.nodes["doc"].createAndFill({}, [])!;

  expect(converter.convert(rootNode)).toBeNull();
});

/*
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

  expect(converter.convert(rootNode)).toBeNull();
});
*/
