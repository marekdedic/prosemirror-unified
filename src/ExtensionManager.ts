import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import type { SyntaxExtension } from "./SyntaxExtension";

import { MarkExtension } from "./MarkExtension";
import { NodeExtension } from "./NodeExtension";

// The state of the expansion of dependencies, only needed while constructing.
interface Expansion {
  // Each extension's dependencies, so that dependencies() is called only once
  // per instance.
  dependencies: Map<Extension, Array<Extension>>;
  // Extensions passed to the constructor, which win over any other instance of
  // the same class.
  directExtensions: Map<Extension["constructor"], Extension>;
  // Direct extensions that have already been added.
  placedDirectExtensions: Set<Extension>;
}

export class ExtensionManager {
  private readonly markExtensionList: Map<
    Extension["constructor"],
    MarkExtension<UnistNode>
  >;
  private readonly nodeExtensionList: Map<
    Extension["constructor"],
    NodeExtension<UnistNode>
  >;
  private readonly otherExtensionList: Map<Extension["constructor"], Extension>;

  public constructor(extensions: Array<Extension>) {
    this.markExtensionList = new Map();
    this.nodeExtensionList = new Map();
    this.otherExtensionList = new Map();

    const expansion: Expansion = {
      dependencies: new Map(),
      directExtensions: new Map(),
      placedDirectExtensions: new Set(),
    };
    for (const extension of extensions) {
      const previous = expansion.directExtensions.get(extension.constructor);
      if (previous !== undefined && previous !== extension) {
        // eslint-disable-next-line no-console -- Intended console warning
        console.warn(
          `Extension ${extension.constructor.name} was passed more than once, using the last instance.`,
        );
      }
      expansion.directExtensions.set(extension.constructor, extension);
    }

    // A direct extension that something depends on is added where its class is
    // first pulled in as a dependency, together with its own dependencies, so
    // that configuring an extension doesn't change the order of the bundle it
    // belongs to. Only if nothing depends on it does it keep its own position.
    const dependedOn = dependedOnClasses(extensions, expansion);
    for (const extension of extensions) {
      if (!dependedOn.has(extension.constructor)) {
        this.add(extension, expansion);
      }
    }
    // Adds direct extensions only reachable through a dependency cycle.
    for (const extension of extensions) {
      this.add(extension, expansion);
    }
  }

  public extensions(): Array<Extension> {
    return (this.syntaxExtensions() as Array<Extension>).concat(
      Array.from(this.otherExtensionList.values()),
    );
  }

  public markExtensions(): Array<MarkExtension<UnistNode>> {
    return Array.from(this.markExtensionList.values());
  }

  public nodeExtensions(): Array<NodeExtension<UnistNode>> {
    return Array.from(this.nodeExtensionList.values());
  }

  public syntaxExtensions(): Array<SyntaxExtension<UnistNode>> {
    return (this.nodeExtensions() as Array<SyntaxExtension<UnistNode>>).concat(
      this.markExtensions(),
    );
  }

  private add(extension: Extension, expansion: Expansion): void {
    const direct = expansion.directExtensions.get(extension.constructor);
    if (direct !== undefined) {
      if (expansion.placedDirectExtensions.has(direct)) {
        return;
      }
      expansion.placedDirectExtensions.add(direct);
    }
    const resolved = direct ?? extension;
    for (const dependency of dependenciesOf(resolved, expansion)) {
      this.add(dependency, expansion);
    }
    this.set(resolved);
  }

  private set(extension: Extension): void {
    if (isMarkExtension(extension)) {
      this.markExtensionList.set(extension.constructor, extension);
      return;
    }
    if (isNodeExtension(extension)) {
      this.nodeExtensionList.set(extension.constructor, extension);
      return;
    }
    this.otherExtensionList.set(extension.constructor, extension);
  }
}

function dependedOnClasses(
  extensions: Array<Extension>,
  expansion: Expansion,
): Set<Extension["constructor"]> {
  const dependedOn = new Set<Extension["constructor"]>();
  const visited = new Set<Extension>();
  const visit = (extension: Extension): void => {
    const resolved =
      expansion.directExtensions.get(extension.constructor) ?? extension;
    if (visited.has(resolved)) {
      return;
    }
    visited.add(resolved);
    for (const dependency of dependenciesOf(resolved, expansion)) {
      dependedOn.add(dependency.constructor);
      visit(dependency);
    }
  };
  for (const extension of extensions) {
    visit(extension);
  }
  return dependedOn;
}

function dependenciesOf(
  extension: Extension,
  expansion: Expansion,
): Array<Extension> {
  let dependencies = expansion.dependencies.get(extension);
  if (dependencies === undefined) {
    dependencies = extension.dependencies();
    expansion.dependencies.set(extension, dependencies);
  }
  return dependencies;
}

function isMarkExtension(
  extension: Extension,
): extension is MarkExtension<UnistNode> {
  return extension instanceof MarkExtension;
}

function isNodeExtension(
  extension: Extension,
): extension is NodeExtension<UnistNode> {
  return extension instanceof NodeExtension;
}
