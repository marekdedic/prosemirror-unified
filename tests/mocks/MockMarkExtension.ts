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
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends MarkExtension<UNode, UnistToProseMirrorContext> {
  public processConvertedUnistNode =
    vi.fn<(convertedNode: UnistNode, originalMark: Mark) => UNode>();

  public proseMirrorMarkName = vi.fn<() => string | null>();

  public proseMirrorMarkSpec = vi.fn<() => MarkSpec | null>();

  public unistNodeName = vi.fn<() => UNode["type"]>();

  public unistNodeToProseMirrorNodes =
    vi.fn<
      (
        node: UNode,
        schema: Schema<string, string>,
        convertedChildren: Array<ProseMirrorNode>,
        context: Partial<UnistToProseMirrorContext>,
      ) => Array<ProseMirrorNode>
    >();
}
