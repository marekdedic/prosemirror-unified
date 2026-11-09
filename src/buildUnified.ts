import type { Node as UnistNode } from "unist";

import { type Processor, unified } from "unified";

import type { ExtensionManager } from "./ExtensionManager";

export function buildUnified(
  extensionManager: ExtensionManager,
): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
  let processor = unified() as unknown as Processor<
    UnistNode,
    UnistNode,
    UnistNode,
    UnistNode,
    string
  >;
  for (const extension of extensionManager.extensions()) {
    processor = extension.unifiedInitializationHook(processor);
  }
  return processor;
}
