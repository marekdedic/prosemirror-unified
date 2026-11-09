import type { Schema } from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";

import { chainCommands } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import type { ExtensionManager } from "./ExtensionManager";

export class KeymapBuilder {
  private readonly extensionManager: ExtensionManager;
  private plugin: Plugin | undefined;
  private readonly proseMirrorSchema: Schema<string, string>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.extensionManager = extensionManager;
    this.proseMirrorSchema = proseMirrorSchema;
  }

  /**
   * Builds the plugin on the first call only, and returns the same instance
   * from then on.
   */
  public build(): Plugin {
    this.plugin ??= this.createPlugin();
    return this.plugin;
  }

  private createPlugin(): Plugin {
    const commandsByKey = new Map<string, Array<Command>>();
    for (const extension of this.extensionManager.syntaxExtensions()) {
      const map = extension.proseMirrorKeymap(this.proseMirrorSchema);
      for (const key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
          commandsByKey.set(key, [...(commandsByKey.get(key) ?? []), map[key]]);
        }
      }
    }
    const chainedKeymap: Record<string, Command> = {};
    commandsByKey.forEach((commands, key) => {
      chainedKeymap[key] = chainCommands(...commands);
    });
    return keymap(chainedKeymap);
  }
}
