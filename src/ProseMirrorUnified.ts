import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import type { Extension } from "./Extension";

import { buildExtensionPlugins } from "./buildExtensionPlugins";
import { buildInputRulesPlugin } from "./buildInputRulesPlugin";
import { buildKeymapPlugin } from "./buildKeymapPlugin";
import { buildNodeViews } from "./buildNodeViews";
import { buildPastePlugin } from "./buildPastePlugin";
import { buildSchema } from "./buildSchema";
import { buildUnified } from "./buildUnified";
import { ExtensionManager } from "./ExtensionManager";
import { ProseMirrorToUnistConverter } from "./ProseMirrorToUnistConverter";
import { UnistToProseMirrorConverter } from "./UnistToProseMirrorConverter";

export class ProseMirrorUnified {
  private readonly builtSchema: Schema<string, string>;
  // The editor-side parts are built on first use and kept from then on, so
  // that the extensions' hooks for them don't run for apps that only parse
  // and serialize, and so that every call returns the same instances.
  private cachedBaseKeymapPlugin: Plugin | undefined;
  private cachedExtensionPlugins: Array<Plugin> | undefined;
  private cachedInputRulesPlugin: Plugin | undefined;
  private cachedKeymapPlugin: Plugin | undefined;
  private cachedNodeViews: Record<string, NodeViewConstructor> | undefined;
  private cachedPastePlugin: Plugin | undefined;
  private readonly extensionManager: ExtensionManager;
  private readonly proseMirrorToUnistConverter: ProseMirrorToUnistConverter;
  private readonly unified: Processor<
    UnistNode,
    UnistNode,
    UnistNode,
    UnistNode,
    string
  >;
  private readonly unistToProseMirrorConverter: UnistToProseMirrorConverter;

  public constructor(extensions: Array<Extension> = []) {
    this.extensionManager = new ExtensionManager(extensions);
    this.builtSchema = buildSchema(this.extensionManager);
    this.unistToProseMirrorConverter = new UnistToProseMirrorConverter(
      this.extensionManager,
      this.builtSchema,
    );
    this.proseMirrorToUnistConverter = new ProseMirrorToUnistConverter(
      this.extensionManager,
    );
    this.unified = buildUnified(this.extensionManager);
  }

  public extensionPlugins(): Array<Plugin> {
    this.cachedExtensionPlugins ??= buildExtensionPlugins(
      this.extensionManager,
      this.builtSchema,
    );
    // A copy, so that callers can't change the cached array.
    return [...this.cachedExtensionPlugins];
  }

  public inputRulesPlugin(): Plugin {
    this.cachedInputRulesPlugin ??= buildInputRulesPlugin(
      this.extensionManager,
      this.builtSchema,
    );
    return this.cachedInputRulesPlugin;
  }

  public keymapPlugin(): Plugin {
    this.cachedKeymapPlugin ??= buildKeymapPlugin(
      this.extensionManager,
      this.builtSchema,
    );
    return this.cachedKeymapPlugin;
  }

  public nodeViews(): Record<string, NodeViewConstructor> {
    this.cachedNodeViews ??= buildNodeViews(this.extensionManager);
    // A copy, so that callers can't change the cached object.
    return { ...this.cachedNodeViews };
  }

  public parse(source: string): ProseMirrorNode {
    return this.unistToProseMirrorConverter.convert(this.parseToUnist(source));
  }

  public pastePlugin(): Plugin {
    this.cachedPastePlugin ??= buildPastePlugin(
      this.unistToProseMirrorConverter,
      (source) => this.parseToUnist(source),
    );
    return this.cachedPastePlugin;
  }

  public plugins(): Array<Plugin> {
    this.cachedBaseKeymapPlugin ??= keymap(baseKeymap);
    // The base keymap comes last, since it handles keys such as Enter and
    // Backspace, which would otherwise never reach the other plugins. The
    // extensions' keymap goes before their plugins, as they bind keys there.
    return [
      this.inputRulesPlugin(),
      this.keymapPlugin(),
      ...this.extensionPlugins(),
      this.pastePlugin(),
      this.cachedBaseKeymapPlugin,
    ];
  }

  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public serialize(doc: ProseMirrorNode): string {
    const unist = this.proseMirrorToUnistConverter.convert(doc);
    const source: string = this.unified.stringify(unist);
    return source;
  }

  private parseToUnist(source: string): UnistNode {
    return this.unified.runSync(this.unified.parse(source));
  }
}
