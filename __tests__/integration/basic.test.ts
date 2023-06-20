import type { Mocked } from "jest-mock";
import { mocked } from "jest-mock";
import { createEditor } from "jest-prosemirror";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { NodeExtension } from "../../src/NodeExtension";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";

jest.mock("../../src/UnifiedBuilder");

interface UnistRoot extends UnistNode {
  type: "root";
  children: Array<UnistParagraph>;
}

const rootSpec: NodeSpec = {
  content: "paragraph+",
};

class RootExtension extends NodeExtension<UnistRoot> {
  public unistNodeName(): "root" {
    return "root";
  }
  public proseMirrorNodeName(): "doc" {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return rootSpec;
  }

  public unistNodeToProseMirrorNodes(
    _: UnistRoot,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistRoot> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<UnistParagraph>,
      },
    ];
  }
}

interface UnistParagraph extends UnistNode {
  type: "paragraph";
  children: Array<UnistText>;
}

const paragraphSpec: NodeSpec = {
  content: "inline*",
  toDOM(): DOMOutputSpec {
    return ["p", 0];
  },
};

class ParagraphExtension extends NodeExtension<UnistParagraph> {
  public unistNodeName(): "paragraph" {
    return "paragraph";
  }

  public proseMirrorNodeName(): string {
    return "paragraph";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return paragraphSpec;
  }

  public unistNodeToProseMirrorNodes(
    _: UnistParagraph,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren);
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<UnistParagraph> {
    return [
      { type: "paragraph", children: convertedChildren as Array<UnistText> },
    ];
  }
}

interface UnistText extends UnistNode {
  type: "text";
  value: string;
}

const textSpec: NodeSpec = {
  group: "inline",
};

class TextExtension extends NodeExtension<UnistText> {
  public unistNodeName(): "text" {
    return "text";
  }

  public proseMirrorNodeName(): string {
    return "text";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return textSpec;
  }

  public unistNodeToProseMirrorNodes(node: UnistText): Array<ProseMirrorNode> {
    return [this.proseMirrorSchema().text(node.value)];
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<UnistText> {
    return [{ type: "text", value: node.text ?? "" }];
  }
}

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
