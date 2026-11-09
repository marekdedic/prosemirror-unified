import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import type { ExtensionManager } from "./ExtensionManager";

export class PluginsBuilder {
  private readonly extensionManager: ExtensionManager;
  private plugins: Array<Plugin> | undefined;
  private readonly proseMirrorSchema: Schema<string, string>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.extensionManager = extensionManager;
    this.proseMirrorSchema = proseMirrorSchema;
  }

  /**
   * Calls the extensions' hooks on the first call only, and returns the same
   * plugins from then on. Each call returns a new array, so that callers can't
   * change the stored one.
   */
  public build(): Array<Plugin> {
    this.plugins ??= ([] as Array<Plugin>).concat.apply(
      [],
      this.extensionManager
        .extensions()
        .map((extension) =>
          extension.proseMirrorPlugins(this.proseMirrorSchema),
        ),
    );
    return [...this.plugins];
  }
}
