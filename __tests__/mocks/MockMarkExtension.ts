import type {
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { MarkExtension } from "../../src/MarkExtension";

export class MockMarkExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends MarkExtension<UNode, UnistToProseMirrorContext> {
  public proseMirrorMarkName = jest.fn<string | null, []>();

  public proseMirrorMarkSpec = jest.fn<MarkSpec | null, []>();

  public processConvertedUnistNode = jest.fn<UNode, [UnistNode, Mark]>();

  public unistNodeName = jest.fn<UNode["type"], []>();

  public unistNodeToProseMirrorNodes = jest.fn<
    Array<ProseMirrorNode>,
    [
      UNode,
      Schema<string, string>,
      Array<ProseMirrorNode>,
      Partial<UnistToProseMirrorContext>,
    ]
  >();
}
