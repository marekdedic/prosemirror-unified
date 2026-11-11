import type { NodeViewConstructor } from "prosemirror-view";

import { builders } from "prosemirror-test-builder";
import { expect, test, vi } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { Extension } from "../../src/Extension";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { CalloutExtension } from "./CalloutExtension";
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

  const { doc, paragraph } = builders(pmu.schema());
  const proseMirrorTree = doc(paragraph("Hello World!"));

  vi.spyOn(console, "warn").mockImplementation(() => {});
  const proseMirrorRoot = pmu.parse(source);
  const testEditor = renderProseMirror(proseMirrorRoot);

  expect(testEditor.state.schema.spec.marks.size).toBe(0);
  expect(testEditor.state.schema.spec.nodes.size).toBe(3);
  expect(testEditor.state.schema.spec.nodes.get("doc")).toBe(rootSpec);
  expect(testEditor.state.schema.spec.nodes.get("paragraph")).toBe(
    paragraphSpec,
  );
  expect(testEditor.state.schema.spec.nodes.get("text")).toBe(textSpec);
  expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTree);
  expect(parserProvider.parsed).toStrictEqual([source]);
  expect(parserProvider.transformed).toHaveLength(1);

  expect(pmu.serialize(testEditor.doc)).toBe(source);

  expect(parserProvider.stringified).toStrictEqual([unistTree]);

  expect(console.warn).not.toHaveBeenCalled();
});

class CalloutSetExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [
      new RootExtension(),
      new TextExtension(),
      new ParagraphExtension(),
      new CalloutExtension(),
    ];
  }
}

test.each([
  ["after", false],
  ["before", true],
])(
  "A configured extension passed %s an extension set overrides the set's instance",
  (_, configuredFirst) => {
    const configuredNodeView: NodeViewConstructor = () => ({
      dom: document.createElement("figure"),
    });
    const configured = new CalloutExtension(configuredNodeView);
    const set = new CalloutSetExtension();

    vi.spyOn(console, "warn").mockImplementation(() => {});
    const pmu = new ProseMirrorUnified(
      configuredFirst ? [configured, set] : [set, configured],
    );

    expect(pmu.nodeViews()).toStrictEqual({ callout: configuredNodeView });
    // The configured extension doesn't change the order of the schema, so the
    // paragraph stays the default block.
    expect(Object.keys(pmu.schema().nodes)).toStrictEqual([
      "doc",
      "text",
      "paragraph",
      "callout",
    ]);
    expect(console.warn).not.toHaveBeenCalled();
  },
);

/* eslint-enable */
