import { expect, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { Extension } from "../../src/Extension";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

class SetExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new RootExtension(), new TextExtension(), new ParagraphExtension()];
  }
}

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with an extension set", () => {
  expect.assertions(11);

  const source = "<p>Hello World!</p>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [
          {
            type: "text",
            value: "Hello World!",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([parserProvider, new SetExtension()]);

  const proseMirrorTree = pmu
    .schema()
    .nodes["doc"].create(
      {},
      pmu
        .schema()
        .nodes["paragraph"].createAndFill(
          {},
          pmu.schema().text("Hello World!"),
        ),
    );

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const proseMirrorRoot = pmu.parse(source);
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(source);

  expect(parserProvider.stringified).toStrictEqual([unistTree]);

  expect(console.warn).not.toHaveBeenCalled();
});

/* eslint-enable */
