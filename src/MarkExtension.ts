import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

/**
 * @public
 */
export abstract class MarkExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtension<UNode, UnistToProseMirrorContext> {
  public proseMirrorToUnistTest(node: UnistNode, mark: Mark): boolean {
    return (
      node.type === "text" && mark.type.name === this.proseMirrorMarkName()
    );
  }

  public abstract proseMirrorMarkName(): string | null;

  public abstract proseMirrorMarkSpec(): MarkSpec | null;

  public abstract processConvertedUnistNode(
    convertedNode: UnistNode,
    originalMark: Mark,
  ): UNode;
}
