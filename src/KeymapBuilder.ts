import type { Schema } from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";

import { baseKeymap, chainCommands } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import type { ExtensionManager } from "./ExtensionManager";

export class KeymapBuilder {
  private readonly keymap: Map<string, Array<Command>>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.keymap = new Map();
    for (const extension of extensionManager.syntaxExtensions()) {
      this.addKeymap(extension.proseMirrorKeymap(proseMirrorSchema));
    }
    this.addKeymap(baseKeymap);
  }

  public build(): Plugin {
    const chainedKeymap: Record<string, Command> = {};
    this.keymap.forEach((commands, key) => {
      chainedKeymap[key] = chainCommands(...commands);
    });
    return keymap(chainedKeymap);
  }

  private addKeymap(map: Record<string, Command>): void {
    for (const key in map) {
      if (!Object.prototype.hasOwnProperty.call(map, key)) {
        continue;
      }
      if (!this.keymap.get(key)) {
        this.keymap.set(key, []);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Set above.
      this.keymap.get(key)!.push(map[key]);
    }
  }
}
