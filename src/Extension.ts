import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

export abstract class Extension {
  /* eslint-disable @typescript-eslint/class-methods-use-this -- Invalid for interfaces */
  public dependencies(): Array<Extension> {
    return [];
  }

  public proseMirrorPlugins(
    // @ts-expect-error: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- This method is meant to be overriden
    proseMirrorSchema: Schema<string, string>,
  ): Array<Plugin> {
    return [];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>,
  ): Processor<UnistNode, UnistNode, UnistNode, UnistNode, string> {
    return processor;
  }
  /* eslint-enable */
}
