import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export class PluginsBuilder {
  private readonly plugins: Array<Plugin>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.plugins = ([] as Array<Plugin>).concat.apply(
      [],
      extensionManager
        .extensions()
        .map((extension) => extension.proseMirrorPlugins(proseMirrorSchema)),
    );
  }

  public build(): Array<Plugin> {
    return [...this.plugins];
  }
}
