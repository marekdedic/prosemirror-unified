import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { vi } from "vitest";

import { SyntaxExtension } from "../../src/SyntaxExtension";

export class MockSyntaxExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtension<UNode, UnistToProseMirrorContext> {
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
