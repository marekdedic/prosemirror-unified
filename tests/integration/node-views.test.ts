import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { expect, test, vi } from "vitest";

import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { CalloutExtension, calloutNodeView } from "./CalloutExtension";
import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, type UnistRoot } from "./RootExtension";
import { TextExtension } from "./TextExtension";

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Rendering a document with a node view", () => {
  expect.assertions(8);

  const source = "<p>Hello <callout /></p>";
  const unistTree: UnistRoot = {
    children: [
      {
        children: [{ type: "text", value: "Hello " }, { type: "callout" }],
        type: "paragraph",
      },
    ],
    type: "root",
  };

  const parserProvider = new ParserProviderExtension(unistTree, source);

  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
    new CalloutExtension(),
  ]);

  vi.spyOn(console, "warn").mockImplementation(() => {});

  // Only the extension that provides one contributes a node view.
  expect(pmu.nodeViews()).toStrictEqual({ callout: calloutNodeView });

  const view = new EditorView(document.createElement("div"), {
    nodeViews: pmu.nodeViews(),
    state: EditorState.create({
      doc: pmu.parse(source),
      schema: pmu.schema(),
    }),
  });

  // The node view rendered, rather than the node spec's toDOM.
  expect(view.dom.querySelectorAll("aside.callout")).toHaveLength(1);
  expect(view.dom.querySelectorAll("span")).toHaveLength(0);
  expect(view.dom.querySelectorAll("p")).toHaveLength(1);
  expect(view.dom.textContent).toBe("Hello ");

  expect(pmu.serialize(view.state.doc)).toBe(source);
  expect(parserProvider.stringified).toStrictEqual([unistTree]);

  expect(console.warn).not.toHaveBeenCalled();

  view.destroy();
});

/* eslint-enable */
