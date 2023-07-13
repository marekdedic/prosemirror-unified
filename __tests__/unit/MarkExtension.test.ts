import { Schema } from "prosemirror-model";

import { Extension } from "../../src/Extension";
import { MarkExtension } from "../../src/MarkExtension";
import { SyntaxExtension } from "../../src/SyntaxExtension";
import { MockMarkExtension } from "../mocks/MockMarkExtension";

test("MarkExtension.proseMirrorToUnistTest has a default implementation", () => {
  const extension = new MockMarkExtension();
  extension.proseMirrorMarkName.mockReturnValue("mark1");
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
    marks: {
      mark1: {},
      mark2: {},
    },
  });
  const mark1 = schema.marks["mark1"].create();
  const mark2 = schema.marks["mark2"].create();

  expect(extension).toBeInstanceOf(MarkExtension);
  expect(extension).toBeInstanceOf(SyntaxExtension);
  expect(extension).toBeInstanceOf(Extension);

  expect(extension.proseMirrorToUnistTest({ type: "text" }, mark1)).toBe(true);
  expect(extension.proseMirrorToUnistTest({ type: "other" }, mark1)).toBe(
    false,
  );
  expect(extension.proseMirrorToUnistTest({ type: "text" }, mark2)).toBe(false);
  expect(extension.proseMirrorToUnistTest({ type: "other" }, mark2)).toBe(
    false,
  );
});
