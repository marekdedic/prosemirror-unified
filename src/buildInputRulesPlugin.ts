import type { Schema } from "prosemirror-model";
import type { Plugin, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { type InputRule, inputRules } from "prosemirror-inputrules";

import type { ExtensionManager } from "./ExtensionManager";

import { isEnterInputRule } from "./EnterInputRule";

// Runs the rules of `rulesPlugin`, which isn't in the editor state, as if the
// user typed a line ending. The undo record of a rule that applies goes to
// `statePlugin`, the plugin in the editor state, without the line ending as
// text: it was never inserted, so undoing the rule mustn't insert it either.
const runRulesOnEnter = (
  rulesPlugin: Plugin,
  statePlugin: Plugin,
  view: EditorView,
): boolean => {
  const { from, to } = view.state.selection;
  // The view as is, except for where the undo record goes
  const rulesView = Object.create(view, {
    dispatch: {
      value: (tr: Transaction): void => {
        const undoable: unknown = tr.getMeta(rulesPlugin);
        if (typeof undoable === "object" && undoable !== null) {
          tr.setMeta(statePlugin, { ...undoable, text: "" });
        }
        view.dispatch(tr);
      },
    },
  }) as EditorView;
  return (
    rulesPlugin.props.handleTextInput?.call(
      rulesPlugin,
      rulesView,
      from,
      to,
      "\n",
      () => view.state.tr,
    ) === true
  );
};

export function buildInputRulesPlugin(
  extensionManager: ExtensionManager,
  proseMirrorSchema: Schema<string, string>,
): Plugin {
  const rules = ([] as Array<InputRule>).concat.apply(
    [],
    extensionManager
      .syntaxExtensions()
      .map((extension) => extension.proseMirrorInputRules(proseMirrorSchema)),
  );
  const inputRulesPlugin = inputRules({ rules });
  const enterRules: Array<InputRule> = [];
  const otherRules: Array<InputRule> = [];
  for (const rule of rules) {
    if (isEnterInputRule(rule)) {
      enterRules.push(rule);
    } else {
      otherRules.push(rule);
    }
  }
  // Not added to the editor state, these only run the rules on Enter: the
  // rules that replace Enter first, then the ones that only react to it.
  // Either is skipped when it would have no rules.
  const enterRulesPlugin =
    enterRules.length > 0 ? inputRules({ rules: enterRules }) : null;
  const otherRulesPlugin =
    otherRules.length > 0 ? inputRules({ rules: otherRules }) : null;
  const originalHandleKeyDown =
    inputRulesPlugin.props.handleKeyDown?.bind(inputRulesPlugin);
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Type from prosemirror-view
  inputRulesPlugin.props.handleKeyDown = (view, event): boolean | void => {
    // Enter isn't text input, so the rules only see it when it's passed to
    // them as a line ending. Modified Enter keys (e.g. Shift-Enter for a hard
    // break) mean something else, and there's no line to end outside a
    // textblock (e.g. with a block node selected) or across several of them.
    if (
      event.key === "Enter" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      view.state.selection.$from.parent.isTextblock &&
      view.state.selection.$from.sameParent(view.state.selection.$to)
    ) {
      if (
        enterRulesPlugin !== null &&
        runRulesOnEnter(enterRulesPlugin, inputRulesPlugin, view)
      ) {
        return true;
      }
      if (otherRulesPlugin !== null) {
        runRulesOnEnter(otherRulesPlugin, inputRulesPlugin, view);
      }
    }
    return originalHandleKeyDown?.(view, event);
  };
  return inputRulesPlugin;
}
