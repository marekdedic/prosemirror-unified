import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ExtensionManager } from "./ExtensionManager";

export class SchemaBuilder {
  private readonly markOwners: Record<string, string> = {};
  private readonly marks: Record<string, MarkSpec> = {};
  private readonly nodeOwners: Record<string, string> = {};
  private readonly nodes: Record<string, NodeSpec> = {};

  public constructor(extensionManager: ExtensionManager) {
    for (const extension of extensionManager.nodeExtensions()) {
      const name = extension.proseMirrorNodeName();
      const spec = extension.proseMirrorNodeSpec();
      if (name === null || spec === null) {
        continue;
      }
      if (name in this.nodes) {
        throw SchemaBuilder.duplicateError(
          "node",
          name,
          this.nodeOwners[name],
          extension.constructor.name,
        );
      }
      this.nodeOwners[name] = extension.constructor.name;
      this.nodes[name] = spec;
    }
    for (const extension of extensionManager.markExtensions()) {
      const name = extension.proseMirrorMarkName();
      const spec = extension.proseMirrorMarkSpec();
      if (name === null || spec === null) {
        continue;
      }
      if (name in this.marks) {
        throw SchemaBuilder.duplicateError(
          "mark",
          name,
          this.markOwners[name],
          extension.constructor.name,
        );
      }
      this.markOwners[name] = extension.constructor.name;
      this.marks[name] = spec;
    }
  }

  private static duplicateError(
    kind: string,
    name: string,
    previousOwner: string,
    owner: string,
  ): Error {
    // Two distinct classes can share a name, in which case naming them twice
    // would be more confusing than helpful.
    if (previousOwner === owner) {
      return new Error(
        `Two different extensions named "${owner}" both provide the ProseMirror ${kind} "${name}".`,
      );
    }
    return new Error(
      `Two extensions (${previousOwner} and ${owner}) both provide the ProseMirror ${kind} "${name}".`,
    );
  }

  public build(): Schema<string, string> {
    return new Schema<string, string>({
      marks: this.marks,
      nodes: this.nodes,
    });
  }
}
