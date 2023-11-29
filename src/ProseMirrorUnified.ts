import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { ExtensionManager } from "./ExtensionManager";
import { InputRulesBuilder } from "./InputRulesBuilder";
import { KeymapBuilder } from "./KeymapBuilder";
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
  private readonly unistToProseMirrorConverter: UnistToProseMirrorConverter;
  private readonly proseMirrorToUnistConverter: ProseMirrorToUnistConverter;
  private readonly unified: Processor<
    UnistNode,
    UnistNode,
    UnistNode,
    UnistNode,
    string
  >;

  public constructor(extensions: Array<Extension> = []) {
    const extensionManager = new ExtensionManager(extensions);
    this.builtSchema = new SchemaBuilder(extensionManager).build();
    this.inputRulesBuilder = new InputRulesBuilder(
      extensionManager,
      this.builtSchema,
    );
    this.keymapBuilder = new KeymapBuilder(extensionManager, this.builtSchema);
    this.unistToProseMirrorConverter = new UnistToProseMirrorConverter(
      extensionManager,
      this.builtSchema,
    );
    this.proseMirrorToUnistConverter = new ProseMirrorToUnistConverter(
      extensionManager,
    );
    this.unified = new UnifiedBuilder(extensionManager).build();
  }

  public parse(source: string): ProseMirrorNode {
    const unist = this.unified.runSync(this.unified.parse(source));
    const ret = this.unistToProseMirrorConverter.convert(unist);
    return ret;
  }

  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public inputRulesPlugin(): Plugin {
    return this.inputRulesBuilder.build();
  }

  public keymapPlugin(): Plugin {
    return this.keymapBuilder.build();
  }

  public serialize(doc: ProseMirrorNode): string {
    const unist = this.proseMirrorToUnistConverter.convert(doc);
    const source: string = this.unified.stringify(unist);
    return source;
  }
}
