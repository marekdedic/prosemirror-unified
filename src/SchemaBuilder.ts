import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ExtensionManager } from "./ExtensionManager";

export class SchemaBuilder {
  private readonly markOwners = new Map<string, unknown>();
  private readonly marks: Record<string, MarkSpec> = {};
  private readonly nodeOwners = new Map<string, unknown>();
  private readonly nodes: Record<string, NodeSpec> = {};

  public constructor(extensionManager: ExtensionManager) {
    for (const extension of extensionManager.nodeExtensions()) {
      const name = extension.proseMirrorNodeName();
      const spec = extension.proseMirrorNodeSpec();
      if (name !== null && spec !== null) {
        warnOnConflict(this.nodeOwners, "node", name, extension);
        this.nodes[name] = spec;
      }
    }
    for (const extension of extensionManager.markExtensions()) {
      const name = extension.proseMirrorMarkName();
      const spec = extension.proseMirrorMarkSpec();
      if (name !== null && spec !== null) {
        warnOnConflict(this.markOwners, "mark", name, extension);
        this.marks[name] = spec;
      }
    }
  }

  public build(): Schema<string, string> {
    return new Schema<string, string>({
      marks: this.marks,
      nodes: this.nodes,
    });
  }
}

function warnOnConflict(
  owners: Map<string, unknown>,
  kind: string,
  name: string,
  extension: object,
): void {
  const previousOwner = owners.get(name);
  if (previousOwner !== undefined && previousOwner !== extension.constructor) {
    // eslint-disable-next-line no-console -- Intended console warning
    console.warn(
      `Two different extensions provide a ProseMirror ${kind} spec for "${name}", only the last one will be used. This usually means that a package providing extensions is present multiple times in your dependency tree.`,
    );
  }
  owners.set(name, extension.constructor);
}
