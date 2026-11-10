import type { Schema } from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";

import { chainCommands } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import type { ExtensionManager } from "./ExtensionManager";

export function buildKeymapPlugin(
  extensionManager: ExtensionManager,
  proseMirrorSchema: Schema<string, string>,
): Plugin {
  const commandsByKey = new Map<string, Array<Command>>();
  for (const extension of extensionManager.syntaxExtensions()) {
    const map = extension.proseMirrorKeymap(proseMirrorSchema);
    for (const key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        const commands = commandsByKey.get(key) ?? [];
        commands.push(map[key]);
        commandsByKey.set(key, commands);
      }
    }
  }
  const chainedKeymap: Record<string, Command> = {};
  commandsByKey.forEach((commands, key) => {
    chainedKeymap[key] = chainCommands(...commands);
  });
  return keymap(chainedKeymap);
}
