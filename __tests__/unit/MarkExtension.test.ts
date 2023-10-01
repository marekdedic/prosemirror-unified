import { Extension } from "../../src/Extension";
import { MarkExtension } from "../../src/MarkExtension";
import { SyntaxExtension } from "../../src/SyntaxExtension";
import { MockMarkExtension } from "../mocks/MockMarkExtension";

test("MarkExtension has the correct classes", () => {
  const extension = new MockMarkExtension();
  extension.proseMirrorMarkName.mockReturnValue("mark1");

  expect(extension).toBeInstanceOf(MarkExtension);
  expect(extension).toBeInstanceOf(SyntaxExtension);
  expect(extension).toBeInstanceOf(Extension);
});
