import type { NodeViewConstructor } from "prosemirror-view";

import type { ExtensionManager } from "./ExtensionManager";

export function buildNodeViews(
  extensionManager: ExtensionManager,
): Record<string, NodeViewConstructor> {
  const nodeViews: Record<string, NodeViewConstructor> = {};
  for (const extension of extensionManager.nodeExtensions()) {
    const proseMirrorNodeName = extension.proseMirrorNodeName();
    const proseMirrorNodeView = extension.proseMirrorNodeView();
    if (proseMirrorNodeName !== null && proseMirrorNodeView !== null) {
      nodeViews[proseMirrorNodeName] = proseMirrorNodeView;
    }
  }
  return nodeViews;
}
