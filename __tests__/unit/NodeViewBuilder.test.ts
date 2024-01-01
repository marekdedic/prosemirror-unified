import { mocked } from "jest-mock";
import type { NodeView } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { ExtensionManager } from "../../src/ExtensionManager";
import { NodeViewBuilder } from "../../src/NodeViewBuilder";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

class DocExtension<UNode extends UnistNode> extends MockNodeExtension<UNode> {}

class TextExtension<UNode extends UnistNode> extends MockNodeExtension<UNode> {}

class Node1Extension<
  UNode extends UnistNode,
> extends MockNodeExtension<UNode> {}

test("NodeViewBuilder creates a plugin", () => {
  const textNodeView = (): NodeView => ({
    dom: document.createElement("span"),
  });

  const node1NodeView = (): NodeView => ({
    dom: document.createElement("li"),
  });

  const docExtension = mocked(new DocExtension());
  docExtension.proseMirrorNodeName.mockReturnValueOnce("doc");
  docExtension.proseMirrorNodeView.mockReturnValueOnce(null);
  const textExtension = mocked(new TextExtension());
  textExtension.proseMirrorNodeName.mockReturnValueOnce("text");
  textExtension.proseMirrorNodeView.mockReturnValueOnce(textNodeView);
  const node1Extension = mocked(new Node1Extension());
  node1Extension.proseMirrorNodeName.mockReturnValueOnce("node1");
  node1Extension.proseMirrorNodeView.mockReturnValueOnce(node1NodeView);

  const manager = new ExtensionManager([
    docExtension,
    textExtension,
    node1Extension,
  ]);

  const builder = new NodeViewBuilder(manager);
  const nodeViews = builder.build();

  expect(nodeViews).toStrictEqual({ text: textNodeView, node1: node1NodeView });
});
