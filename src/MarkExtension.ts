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
  public abstract processConvertedUnistNode(
    convertedNode: UnistNode,
    originalMark: Mark,
  ): HandledUnistNode;

  public abstract proseMirrorMarkName(): string | null;

  public abstract proseMirrorMarkSpec(): MarkSpec | null;
}
