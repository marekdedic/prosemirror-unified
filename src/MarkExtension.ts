import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "./SyntaxExtension";

export abstract class MarkExtension<
  HandledUnistNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtension<HandledUnistNode, UnistToProseMirrorContext> {
  public abstract processConvertedUnistNodes(
    convertedNodes: Array<UnistNode>,
    originalMark: Mark,
  ): HandledUnistNode;

  public abstract proseMirrorMarkName(): string | null;

  public abstract proseMirrorMarkSpec(): MarkSpec | null;

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Meant to be overridden
  public unistNodeIsLeaf(): boolean {
    return false;
  }
}
