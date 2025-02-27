import type { Node as UnistNode } from "unist";

import { type Processor, unified } from "unified";
import { expect, type Mocked, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

import { Extension } from "../../src/Extension";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

vi.mock("unified");

class SetExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new RootExtension(), new TextExtension(), new ParagraphExtension()];
  }
}

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Parsing a document with an extension set", () => {
  expect.assertions(13);

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

  const unifiedMock = {
    parse: vi.fn<(file: string) => UnistNode>().mockReturnValueOnce(unistTree),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockImplementation((root) => root),
    stringify: vi.fn<(tree: UnistNode) => string>().mockReturnValueOnce(source),
  } as unknown as Mocked<Processor>;

  vi.mocked(unified).mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([new SetExtension()]);

  const proseMirrorTree = pmu
    .schema()
    .nodes[
      "doc"
    ].create({}, pmu.schema().nodes["paragraph"].createAndFill({}, pmu.schema().text("Hello World!")));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const proseMirrorRoot = pmu.parse(source);
  const testEditor = new ProseMirrorTester(proseMirrorRoot);

  expect(testEditor.schema.spec.marks.size).toBe(0);
  expect(testEditor.schema.spec.nodes.size).toBe(3);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
  expect(testEditor.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
  expect(unifiedMock.parse).toHaveBeenCalledWith(source);
  expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

  expect(pmu.serialize(testEditor.doc)).toBe(source);

  expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
  expect(unifiedMock.stringify).toHaveBeenCalledWith(unistTree);

  expect(console.warn).not.toHaveBeenCalled();
});

/* eslint-enable */
