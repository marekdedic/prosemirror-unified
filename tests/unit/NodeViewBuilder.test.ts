import type { NodeView } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { expect, test, vi } from "vitest";

import { ExtensionManager } from "../../src/ExtensionManager";
import { NodeViewBuilder } from "../../src/NodeViewBuilder";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

class DocExtension<
  HandledUnistNode extends UnistNode,
> extends MockNodeExtension<HandledUnistNode> {}

class Node1Extension<
  HandledUnistNode extends UnistNode,
> extends MockNodeExtension<HandledUnistNode> {}

class TextExtension<
  HandledUnistNode extends UnistNode,
> extends MockNodeExtension<HandledUnistNode> {}

test("NodeViewBuilder collects the node views of the extensions", () => {
  const textNodeView = (): NodeView => ({
    dom: document.createElement("span"),
  });

  const node1NodeView = (): NodeView => ({
    dom: document.createElement("li"),
  });

  const docExtension = vi.mocked(new DocExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeView.mockReturnValueOnce(null);
  const textExtension = vi.mocked(new TextExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeView.mockReturnValueOnce(textNodeView);
  const node1Extension = vi.mocked(new Node1Extension());
  node1Extension.proseMirrorNodeName.mockReturnValueOnce("node1");
  node1Extension.proseMirrorNodeView.mockReturnValueOnce(node1NodeView);

  const manager = new ExtensionManager([
    docExtension,
    textExtension,
    node1Extension,
  ]);

  const builder = new NodeViewBuilder(manager);
  const nodeViews = builder.build();

  expect(nodeViews).toStrictEqual({ node1: node1NodeView, text: textNodeView });
});

test("NodeViewBuilder collects the node views once, on the first call", () => {
  const extension = vi.mocked(new Node1Extension());
  extension.proseMirrorNodeName.mockReturnValue("node1");
  extension.proseMirrorNodeView.mockReturnValue(null);

  const builder = new NodeViewBuilder(new ExtensionManager([extension]));

  expect(extension.proseMirrorNodeView).not.toHaveBeenCalled();

  const nodeViews = builder.build();
  const nodeViewsAgain = builder.build();

  expect(nodeViewsAgain).toStrictEqual(nodeViews);
  expect(extension.proseMirrorNodeView).toHaveBeenCalledExactlyOnceWith();

  // A caller changing the returned object doesn't affect later calls.
  expect(nodeViewsAgain).not.toBe(nodeViews);

  nodeViews["node2"] = (): NodeView => ({
    dom: document.createElement("div"),
  });

  expect(builder.build()).toStrictEqual({});
});

test("NodeViewBuilder calls the hooks again after one throws", () => {
  const extension = vi.mocked(new Node1Extension());
  extension.proseMirrorNodeName.mockReturnValue("node1");
  extension.proseMirrorNodeView
    .mockImplementationOnce(() => {
      throw new Error("Failed");
    })
    .mockReturnValueOnce(null);

  const builder = new NodeViewBuilder(new ExtensionManager([extension]));

  expect(() => builder.build()).toThrow("Failed");
  expect(builder.build()).toStrictEqual({});
  expect(extension.proseMirrorNodeView).toHaveBeenCalledTimes(2);
});
