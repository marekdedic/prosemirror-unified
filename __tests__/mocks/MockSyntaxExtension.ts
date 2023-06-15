import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { SyntaxExtension } from "../../src/SyntaxExtension";

export class MockSyntaxExtension<
  UNode extends UnistNode,
  Context extends Record<string, unknown> = Record<string, never>
> extends SyntaxExtension<UNode, Context> {
  public unistNodeName = jest.fn<UNode["type"], []>();

  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [UNode, Array<ProseMirrorNode>, Partial<Context>]
  >();
}
