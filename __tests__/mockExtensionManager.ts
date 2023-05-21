import type { Mocked } from "jest-mock";
import type { Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { Extension } from "../src/Extension";
import type { ExtensionManager } from "../src/ExtensionManager";
import type { MarkExtension } from "../src/MarkExtension";
import type { NodeExtension } from "../src/NodeExtension";
import type { SyntaxExtension } from "../src/SyntaxExtension";

export function mockExtensionManager(): Mocked<ExtensionManager> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    setSchema: jest.fn<void, [Schema<string, string>]>(),
    extensions: jest.fn<Array<Extension>, []>(),
    markExtensions: jest.fn<Array<MarkExtension<UnistNode>>, []>(),
    nodeExtensions: jest.fn<Array<NodeExtension<UnistNode>>, []>(),
    syntaxExtensions: jest.fn<Array<SyntaxExtension<UnistNode>>, []>(),
  } as unknown as Mocked<ExtensionManager>;
}
