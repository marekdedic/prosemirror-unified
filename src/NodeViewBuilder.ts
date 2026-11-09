import type { NodeViewConstructor } from "prosemirror-view";

import type { ExtensionManager } from "./ExtensionManager";

export class NodeViewBuilder {
  private readonly extensionManager: ExtensionManager;
  private nodeViews: Record<string, NodeViewConstructor> | undefined;

  public constructor(extensionManager: ExtensionManager) {
    this.extensionManager = extensionManager;
  }

  /**
   * Calls the extensions' hooks on the first call only, and returns the same
   * node views from then on.
   */
  public build(): Record<string, NodeViewConstructor> {
    this.nodeViews ??= this.collectNodeViews();
    return this.nodeViews;
  }

  private collectNodeViews(): Record<string, NodeViewConstructor> {
    const nodeViews: Record<string, NodeViewConstructor> = {};
    for (const extension of this.extensionManager.nodeExtensions()) {
      const proseMirrorNodeName = extension.proseMirrorNodeName();
      const proseMirrorNodeView = extension.proseMirrorNodeView();
      if (proseMirrorNodeName !== null && proseMirrorNodeView !== null) {
        nodeViews[proseMirrorNodeName] = proseMirrorNodeView;
      }
    }
    return nodeViews;
  }
}
