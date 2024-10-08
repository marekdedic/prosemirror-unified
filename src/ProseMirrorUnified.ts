import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";

import { ExtensionManager } from "./ExtensionManager";
import { InputRulesBuilder } from "./InputRulesBuilder";
import { KeymapBuilder } from "./KeymapBuilder";
import { NodeViewBuilder } from "./NodeViewBuilder";
import { ProseMirrorToUnistConverter } from "./ProseMirrorToUnistConverter";
import { SchemaBuilder } from "./SchemaBuilder";
import { UnifiedBuilder } from "./UnifiedBuilder";
import { UnistToProseMirrorConverter } from "./UnistToProseMirrorConverter";

/**
 * @public
 */
export class ProseMirrorUnified {
  private readonly builtSchema: Schema<string, string>;
  private readonly inputRulesBuilder: InputRulesBuilder;
  private readonly keymapBuilder: KeymapBuilder;
  private readonly nodeViewBuilder: NodeViewBuilder;
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
    this.unistToProseMirrorConverter = new UnistToProseMirrorConverter(
      extensionManager,
      this.builtSchema,
    );
    this.proseMirrorToUnistConverter = new ProseMirrorToUnistConverter(
      extensionManager,
    );
    this.unified = new UnifiedBuilder(extensionManager).build();
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
    const unist = this.unified.runSync(this.unified.parse(source));
    const ret = this.unistToProseMirrorConverter.convert(unist);
    return ret;
  }

  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public serialize(doc: ProseMirrorNode): string {
    const unist = this.proseMirrorToUnistConverter.convert(doc);
    const source: string = this.unified.stringify(unist);
    return source;
  }
}
