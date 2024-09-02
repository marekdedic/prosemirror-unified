import type { InputRule } from "prosemirror-inputrules";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { Extension } from "./Extension";

/**
 * @public
 */
export abstract class SyntaxExtension<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends Extension {
  /* eslint-disable @typescript-eslint/class-methods-use-this, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars -- These are invalid for interfaces */
  public postUnistToProseMirrorHook(
    // @ts-expect-error: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    context: Partial<UnistToProseMirrorContext>,
  ): void {}

  public proseMirrorInputRules(
    // @ts-expect-error: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [];
  }

  public proseMirrorKeymap(
    // @ts-expect-error: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    proseMirrorSchema: Schema<string, string>,
  ): Record<string, Command> {
    return {};
  }
  /* eslint-enable */

  public abstract unistNodeName(): UNode["type"];

  public abstract unistNodeToProseMirrorNodes(
    node: UNode,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<UnistToProseMirrorContext>,
  ): Array<ProseMirrorNode>;

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName();
  }
}
