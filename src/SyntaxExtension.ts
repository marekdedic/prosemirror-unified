import type { InputRule } from "prosemirror-inputrules";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import { Extension } from "./Extension";

export abstract class SyntaxExtension<
  UNode extends UnistNode,
  // TODO: Rename to UnistToProseMirrorContext?
  Context extends Record<string, unknown> = Record<string, never>
> extends Extension {
  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName();
  }

  /* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
  public proseMirrorInputRules(
    // @ts-ignore: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    proseMirrorSchema: Schema<string, string>
  ): Array<InputRule> {
    return [];
  }

  public proseMirrorKeymap(
    // @ts-ignore: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    proseMirrorSchema: Schema<string, string>
  ): Record<string, Command> {
    return {};
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  public postUnistToProseMirrorHook(
    // @ts-ignore: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    context: Partial<Context>
  ): void {}
  /* eslint-enable */

  // TODO: This is actually only used in unistToProseMirrorTest, so it probably should be removed.
  public abstract unistNodeName(): UNode["type"];

  public abstract unistNodeToProseMirrorNodes(
    node: UNode,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<Context>
  ): Array<ProseMirrorNode>;
}
