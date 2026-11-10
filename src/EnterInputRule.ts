import type { EditorState, Transaction } from "prosemirror-state";

import { InputRule } from "prosemirror-inputrules";

export type EnterInputRuleHandler = (
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
) => Transaction | null;

export type EnterInputRuleOptions = NonNullable<
  ConstructorParameters<typeof InputRule>[2]
>;

// A registered symbol, so that a rule is recognised even when it comes from
// another copy of this package.
const enterInputRuleKey = Symbol.for("prosemirror-unified.EnterInputRule");

/**
 * An input rule that replaces what Enter does. When it applies to Enter, the key is not handled any further, so the keymaps don't split the block after it.
 */
export class EnterInputRule extends InputRule {
  public constructor(
    matcher: RegExp,
    handler: EnterInputRuleHandler,
    options?: EnterInputRuleOptions,
  ) {
    super(matcher, handler, options);
    if (typeof handler !== "function") {
      throw new TypeError(
        "The handler of an EnterInputRule must be a function",
      );
    }
    // Not enumerable and not part of the type, it is only read by
    // isEnterInputRule. Set here rather than on the prototype, so that it
    // doesn't depend on a module-level statement a bundler might drop.
    Object.defineProperty(this, enterInputRuleKey, { value: true });
  }
}

/**
 * Whether `rule` is an `EnterInputRule`, from any copy of this package. Internal, not part of the public API.
 */
export function isEnterInputRule(rule: InputRule): boolean {
  return (
    (rule as unknown as Partial<Record<symbol, unknown>>)[enterInputRuleKey] ===
    true
  );
}
