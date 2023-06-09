import type { Node as ProseMirrorNode, NodeSpec } from "prosemirror-model";
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

  public abstract proseMirrorNodeName(): string | null;

  public abstract proseMirrorNodeSpec(): NodeSpec | null;

  public abstract proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
    convertedChildren: Array<UnistNode>,
  ): Array<UNode>;
}
