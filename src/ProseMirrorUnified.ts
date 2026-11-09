import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

import type { Extension } from "./Extension";

import { ExtensionManager } from "./ExtensionManager";
import { InputRulesBuilder } from "./InputRulesBuilder";
import { KeymapBuilder } from "./KeymapBuilder";
import { NodeViewBuilder } from "./NodeViewBuilder";
import { PastePluginBuilder } from "./PastePluginBuilder";
import { PluginsBuilder } from "./PluginsBuilder";
import { ProseMirrorToUnistConverter } from "./ProseMirrorToUnistConverter";
import { SchemaBuilder } from "./SchemaBuilder";
import { UnifiedBuilder } from "./UnifiedBuilder";
import { UnistToProseMirrorConverter } from "./UnistToProseMirrorConverter";

export class ProseMirrorUnified {
  private readonly builtSchema: Schema<string, string>;
  private readonly inputRulesBuilder: InputRulesBuilder;
  private readonly keymapBuilder: KeymapBuilder;
  private readonly nodeViewBuilder: NodeViewBuilder;
  private readonly pastePluginBuilder: PastePluginBuilder;
  private readonly pluginsBuilder: PluginsBuilder;
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
    const extensionManager = new ExtensionManager(extensions);
    this.builtSchema = new SchemaBuilder(extensionManager).build();
    this.inputRulesBuilder = new InputRulesBuilder(
      extensionManager,
      this.builtSchema,
    );
    this.keymapBuilder = new KeymapBuilder(extensionManager, this.builtSchema);
    this.nodeViewBuilder = new NodeViewBuilder(extensionManager);
    this.pluginsBuilder = new PluginsBuilder(
      extensionManager,
      this.builtSchema,
    );
    this.unistToProseMirrorConverter = new UnistToProseMirrorConverter(
      extensionManager,
      this.builtSchema,
    );
    this.proseMirrorToUnistConverter = new ProseMirrorToUnistConverter(
      extensionManager,
    );
    this.unified = new UnifiedBuilder(extensionManager).build();
    this.pastePluginBuilder = new PastePluginBuilder(
      this.unistToProseMirrorConverter,
      (source) => this.parseToUnist(source),
    );
  }

  public extensionPlugins(): Array<Plugin> {
    return this.pluginsBuilder.build();
  }

  public inputRulesPlugin(): Plugin {
    return this.inputRulesBuilder.build();
  }

  public keymapPlugin(): Plugin {
    return this.keymapBuilder.build();
  }

  public nodeViews(): Record<string, NodeViewConstructor> {
    return this.nodeViewBuilder.build();
  }

  public parse(source: string): ProseMirrorNode {
    return this.unistToProseMirrorConverter.convert(this.parseToUnist(source));
  }

  public pastePlugin(): Plugin {
    return this.pastePluginBuilder.build();
  }

  public plugins(): Array<Plugin> {
    // The base keymap comes last, since it handles keys such as Enter and
    // Backspace, which would otherwise never reach the other plugins. The
    // extensions' keymap goes before their plugins, as they bind keys there.
    return [
      this.inputRulesPlugin(),
      this.keymapPlugin(),
      ...this.extensionPlugins(),
      this.pastePlugin(),
      keymap(baseKeymap),
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
