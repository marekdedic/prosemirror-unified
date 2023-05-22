import type { Mocked } from "jest-mock";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "../src/Extension";

export function mockExtension(): Mocked<Extension> {
  return {
    dependencies: jest.fn<Array<Extension>, []>(),
    unifiedInitializationHook: jest.fn<
      Processor<UnistNode, UnistNode, UnistNode, string>,
      [Processor<UnistNode, UnistNode, UnistNode, string>]
    >(),
  } as unknown as Mocked<Extension>;
}
