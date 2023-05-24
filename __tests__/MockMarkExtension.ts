import type {
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { MarkExtension } from "../src/MarkExtension";

export class MockMarkExtension<
  UNode extends UnistNode,
  Context = Record<string, never>
> extends MarkExtension<UNode, Context> {
  public proseMirrorMarkName = jest.fn<string | null, []>();

  public proseMirrorMarkSpec = jest.fn<MarkSpec | null, []>();

  public processConvertedUnistNode = jest.fn<UNode, [UnistNode, Mark]>();

  public unistNodeName = jest.fn<UNode["type"], []>();

  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [UNode, Array<ProseMirrorNode>, Partial<Context>]
  >();
}
