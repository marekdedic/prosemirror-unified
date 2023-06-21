import type { Mocked } from "jest-mock";
import { mocked } from "jest-mock";
import { createEditor } from "jest-prosemirror";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";
import { BoldExtension, boldSpec } from "./BoldExtension";
import { ParagraphExtension, paragraphSpec } from "./ParagraphExtension";
import { RootExtension, rootSpec, type UnistRoot } from "./RootExtension";
import { TextExtension, textSpec } from "./TextExtension";

jest.mock("../../src/UnifiedBuilder");

test("Parsing a document with a paragraph", () => {
  expect.assertions(29);

  const source = "Hello <b>World</b>!";
  const unistTree: UnistRoot = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "Hello ",
          },
          {
            type: "bold",
            children: [
              {
                type: "text",
                value: "World",
              },
            ],
          },
          {
            type: "text",
            value: "!",
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
    new BoldExtension(),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);

  const proseMirrorRoot = pmu.parse(source)!;
  createEditor(proseMirrorRoot).callback((content) => {
    expect(content.schema.spec.marks.size).toBe(1);
    expect(content.schema.spec.marks.get("bold")).toBe(boldSpec);
    expect(content.schema.spec.nodes.size).toBe(3);
    expect(content.schema.spec.nodes.get("doc")).toBe(rootSpec);
    expect(content.schema.spec.nodes.get("paragraph")).toBe(paragraphSpec);
    expect(content.schema.spec.nodes.get("text")).toBe(textSpec);
    expect(content.doc.type.name).toBe("doc");
    expect(content.doc.content.childCount).toBe(1);
    expect(content.doc.content.firstChild).not.toBeNull();
    expect(content.doc.content.firstChild!.type.name).toBe("paragraph");
    expect(content.doc.content.firstChild!.content.childCount).toBe(3);
    expect(content.doc.content.firstChild!.content.firstChild).not.toBeNull();
    expect(content.doc.content.firstChild!.content.firstChild!.type.name).toBe(
      "text"
    );
    expect(content.doc.content.firstChild!.content.firstChild!.text).toBe(
      "Hello "
    );
    expect(
      content.doc.content.firstChild!.content.firstChild!.marks
    ).toHaveLength(0);
    expect(content.doc.content.firstChild!.content.child(1).type.name).toBe(
      "text"
    );
    expect(content.doc.content.firstChild!.content.child(1).text).toBe("World");
    expect(content.doc.content.firstChild!.content.child(1).marks).toHaveLength(
      1
    );
    expect(
      content.doc.content.firstChild!.content.child(1).marks[0].type.name
    ).toBe("bold");
    expect(content.doc.content.firstChild!.content.lastChild).not.toBeNull();
    expect(content.doc.content.firstChild!.content.lastChild!.type.name).toBe(
      "text"
    );
    expect(content.doc.content.firstChild!.content.lastChild!.text).toBe("!");
    expect(
      content.doc.content.firstChild!.content.lastChild!.marks
    ).toHaveLength(0);
    expect(unifiedMock.parse).toHaveBeenCalledTimes(1);
    expect(unifiedMock.parse).toHaveBeenCalledWith(source);
    expect(unifiedMock.runSync).toHaveBeenCalledTimes(1);

    expect(pmu.serialize(content.doc)).toBe(source);

    expect(unifiedMock.stringify).toHaveBeenCalledTimes(1);
    expect(unifiedMock.stringify).toHaveBeenCalledWith(unistTree);
  });
});
