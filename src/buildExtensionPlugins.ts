import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export function buildExtensionPlugins(
  extensionManager: ExtensionManager,
  proseMirrorSchema: Schema<string, string>,
): Array<Plugin> {
  return ([] as Array<Plugin>).concat.apply(
    [],
    extensionManager
      .extensions()
      .map((extension) => extension.proseMirrorPlugins(proseMirrorSchema)),
  );
}
