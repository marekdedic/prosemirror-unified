import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

/**
 * @public
 */
export abstract class Extension {
  /* eslint-disable @typescript-eslint/class-methods-use-this -- Invalid for interfaces */
  public dependencies(): Array<Extension> {
    return [];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor;
  }
  /* eslint-enable */
}
