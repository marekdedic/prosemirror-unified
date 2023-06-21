import type { Mocked } from "jest-mock";
import { mocked } from "jest-mock";
import { createEditor } from "jest-prosemirror";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

jest.mock("../../src/UnifiedBuilder");

test("Parsing a document with a paragraph", () => {
  expect.assertions(19);

  const source = "<p>Hello World!</p>";
  const unistTree: UnistRoot = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "Hello World!",
          },
        ],
      },
    ],
  };

  const unifiedMock = {
    parse: jest.fn().mockReturnValueOnce(unistTree),
    runSync: jest.fn().mockImplementation((root: UnistRoot) => root),
    stringify: jest.fn().mockReturnValueOnce(source),
  } as unknown as Mocked<Processor<UnistNode, UnistNode, UnistNode, string>>;

  mocked(UnifiedBuilder).prototype.build.mockReturnValueOnce(unifiedMock);

  const pmu = new ProseMirrorUnified([
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source)!;
  createEditor(proseMirrorRoot).callback((content) => {
    expect(content.schema.spec.marks.size).toBe(0);
    expect(content.schema.spec.nodes.size).toBe(3);
    expect(content.schema.spec.nodes.get("doc")).toBe(rootSpec);
    expect(content.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
    expect(content.schema.spec.nodes.get("text")).toBe(textSpec);
    expect(content.doc.type.name).toBe("doc");
    expect(content.doc.content.childCount).toBe(1);
    expect(content.doc.content.firstChild).not.toBeNull();
    expect(content.doc.content.firstChild!.type.name).toBe("paragraph");
    expect(content.doc.content.firstChild!.content.childCount).toBe(1);
    expect(content.doc.content.firstChild!.content.firstChild).not.toBeNull();
    expect(content.doc.content.firstChild!.content.firstChild!.type.name).toBe(
      "text"
    );
    expect(content.doc.content.firstChild!.content.firstChild!.text).toBe(
      "Hello World!"
    );
    expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
    expect(unifiedMock.parse).toHaveBeenCalledWith(source);
    expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

    expect(pmu.serialize(content.doc)).toBe(source);

    expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
    expect(unifiedMock.stringify).toHaveBeenCalledWith(unistTree);
  });
});
