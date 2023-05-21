import type { Mocked } from "jest-mock";
import type { Mark, MarkSpec } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { MarkExtension } from "../src/MarkExtension";
import { mockExtension } from "./mockExtension";

export function mockMarkExtension<UNode extends UnistNode>(): Mocked<
  MarkExtension<UNode>
> {
  return {
    ...mockExtension(),
    proseMirrorToUnistTest: jest.fn<boolean, [UnistNode, Mark]>(),
    proseMirrorMarkName: jest.fn<string | null, []>(),
    proseMirrorMarkSpec: jest.fn<MarkSpec | null, []>(),
    processConvertedUnistNode: jest.fn<UNode, [UnistNode, Mark]>(),
  } as unknown as Mocked<MarkExtension<UNode>>;
}
