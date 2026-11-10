import { type MarkSpec, type NodeSpec, Schema } from "prosemirror-model";

import type { ExtensionManager } from "./ExtensionManager";

export function buildSchema(
  extensionManager: ExtensionManager,
): Schema<string, string> {
  const markOwners: Record<string, string> = {};
  const marks: Record<string, MarkSpec> = {};
  const nodeOwners: Record<string, string> = {};
  const nodes: Record<string, NodeSpec> = {};
  for (const extension of extensionManager.nodeExtensions()) {
    const name = extension.proseMirrorNodeName();
    const spec = extension.proseMirrorNodeSpec();
    if (name === null || spec === null) {
      continue;
    }
    if (name in nodes) {
      throw duplicateError(
        "node",
        name,
        nodeOwners[name],
        extension.constructor.name,
      );
    }
    nodeOwners[name] = extension.constructor.name;
    nodes[name] = spec;
  }
  for (const extension of extensionManager.markExtensions()) {
    const name = extension.proseMirrorMarkName();
    const spec = extension.proseMirrorMarkSpec();
    if (name === null || spec === null) {
      continue;
    }
    if (name in marks) {
      throw duplicateError(
        "mark",
        name,
        markOwners[name],
        extension.constructor.name,
      );
    }
    markOwners[name] = extension.constructor.name;
    marks[name] = spec;
  }
  return new Schema<string, string>({ marks, nodes });
}

function duplicateError(
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
