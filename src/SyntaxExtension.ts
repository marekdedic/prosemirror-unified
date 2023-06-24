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
  private schema: Schema<string, string> | undefined;

  // TODO: This is hacky, should be done some other way
  public setProseMirrorSchema(schema: Schema<string, string>): void {
    this.schema = schema;
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName();
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    return {};
  }

  /* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
  public postUnistToProseMirrorHook(
    // @ts-ignore: TS6133 causes an error because of an unused parameter - however, this method is meant to be overriden
    context: Partial<Context>
  ): void {}
  /* eslint-enable */

  // TODO: Remove this, it should be done some other way
  protected proseMirrorSchema(): Schema<string, string> {
    return this.schema!;
  }

  // TODO: This is actually only used in unistToProseMirrorTest, so it probably should be removed.
  public abstract unistNodeName(): UNode["type"];

  public abstract unistNodeToProseMirrorNodes(
    node: UNode,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<Context>
  ): Array<ProseMirrorNode>;
}
