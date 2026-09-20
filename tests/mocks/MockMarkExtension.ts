import type {
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { vi } from "vitest";

import { MarkExtension } from "../../src/MarkExtension";

export class MockMarkExtension<
  HandledUnistNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends MarkExtension<HandledUnistNode, UnistToProseMirrorContext> {
  public processConvertedUnistNode =
    vi.fn<(convertedNode: UnistNode, originalMark: Mark) => HandledUnistNode>();

  public proseMirrorMarkName = vi.fn<() => string | null>();

  public proseMirrorMarkSpec = vi.fn<() => MarkSpec | null>();

  public unistNodeName = vi.fn<() => HandledUnistNode["type"]>();

  public unistNodeToProseMirrorNodes =
    vi.fn<
      (
        node: HandledUnistNode,
        schema: Schema<string, string>,
        convertedChildren: Array<ProseMirrorNode>,
        context: Partial<UnistToProseMirrorContext>,
      ) => Array<ProseMirrorNode>
    >();
}
