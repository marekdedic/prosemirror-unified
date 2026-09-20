import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { vi } from "vitest";

import { SyntaxExtension } from "../../src/SyntaxExtension";

export class MockSyntaxExtension<
  HandledUnistNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtension<HandledUnistNode, UnistToProseMirrorContext> {
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
