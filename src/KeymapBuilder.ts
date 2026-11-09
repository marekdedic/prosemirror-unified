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

  private static addKeymap(
    commandsByKey: Map<string, Array<Command>>,
    map: Record<string, Command>,
  ): void {
    for (const key in map) {
      if (!Object.prototype.hasOwnProperty.call(map, key)) {
        continue;
      }
      if (!commandsByKey.get(key)) {
        commandsByKey.set(key, []);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Set above.
      commandsByKey.get(key)!.push(map[key]);
    }
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
      KeymapBuilder.addKeymap(
        commandsByKey,
        extension.proseMirrorKeymap(this.proseMirrorSchema),
      );
    }
    const chainedKeymap: Record<string, Command> = {};
    commandsByKey.forEach((commands, key) => {
      chainedKeymap[key] = chainCommands(...commands);
    });
    return keymap(chainedKeymap);
  }
}
