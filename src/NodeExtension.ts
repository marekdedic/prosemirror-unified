import type { NodeSpec, Node as ProseMirrorNode } from "prosemirror-model";
import type { NodeViewConstructor } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

/**
 * @public
 */
export abstract class NodeExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtension<UNode, UnistToProseMirrorContext> {
  public proseMirrorToUnistTest(node: ProseMirrorNode): boolean {
    return this.proseMirrorNodeName() === node.type.name;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Inalid for an interface
  public proseMirrorNodeView(): NodeViewConstructor | null {
    return null;
  }

  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  public abstract proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UNode>;
}
