import type { NodeViewConstructor } from "prosemirror-view";

import type { ExtensionManager } from "./ExtensionManager";

export class NodeViewBuilder {
  private readonly nodeViews: Record<string, NodeViewConstructor>;

  public constructor(extensionManager: ExtensionManager) {
    this.nodeViews = {};
    for (const extension of extensionManager.nodeExtensions()) {
      const proseMirrorNodeName = extension.proseMirrorNodeName();
      const proseMirrorNodeView = extension.proseMirrorNodeView();
      if (proseMirrorNodeName !== null && proseMirrorNodeView !== null) {
        this.nodeViews[proseMirrorNodeName] = proseMirrorNodeView;
      }
    }
  }

  public build(): Record<string, NodeViewConstructor> {
    return this.nodeViews;
  }
}
