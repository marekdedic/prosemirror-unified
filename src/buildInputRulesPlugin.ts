import type { Schema } from "prosemirror-model";
import type { Plugin, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { type InputRule, inputRules } from "prosemirror-inputrules";

import type { ExtensionManager } from "./ExtensionManager";

import { isEnterInputRule } from "./EnterInputRule";
import { withInputRange } from "./MarkInputRule";

// Makes `plugin`, built by `inputRules()`, record the range typed text
// replaces while its rules run, because
// prosemirror-inputrules passes only its end to their handlers. MarkInputRule
// needs its start.
const recordInputRanges = (plugin: Plugin): Plugin => {
  const originalHandleTextInput = plugin.props.handleTextInput;
  if (originalHandleTextInput !== undefined) {
    plugin.props.handleTextInput = (
      view,
      from,
      to,
      text,
      deflt,
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Type from prosemirror-view
    ): boolean | void =>
      withInputRange({ from, state: view.state, to }, () =>
        originalHandleTextInput.call(plugin, view, from, to, text, deflt),
      );
  }
  return plugin;
};

// Deletes a line ending that `tr` inserted right before `to`, where the
// cursor was. A string handler with a capture group inserts the rest of the
// match after the group, which on Enter is the line ending. That isn't in the
// document, and Enter itself goes on to end the line.
const deleteInsertedLineEnding = (tr: Transaction, to: number): void => {
  const end = tr.mapping.map(to);
  // Only text, not an inline leaf node such as a hard break, whose leaf text
  // may be a line ending too
  const textBefore = tr.doc.resolve(end).nodeBefore;
  if (
    textBefore?.isText === true &&
    textBefore.text?.endsWith("\n") === true &&
    // Inserted by `tr` rather than already in the document, e.g. in a code block
    tr.mapping.invert().mapResult(end - 1, 1).deletedAfter
  ) {
    // Every step clears the stored marks, so keep those the handler set
    const { storedMarks } = tr;
    tr.delete(end - 1, end);
    if (storedMarks !== null) {
      tr.setStoredMarks(storedMarks);
    }
  }
};

// Runs the rules of `rulesPlugin`, which isn't in the editor state, as if the
// user typed a line ending. The undo record of a rule that applies goes to
// `statePlugin`, the plugin in the editor state, without the line ending as
// text: it was never inserted, so undoing the rule mustn't insert it either.
// With `keepLineEnding` false, a line ending the rule inserts as text right
// before the cursor is deleted again.
const runRulesOnEnter = (
  rulesPlugin: Plugin,
  statePlugin: Plugin,
  view: EditorView,
  keepLineEnding: boolean,
): boolean => {
  const { from, to } = view.state.selection;
  // The view as is, except for where the undo record goes
  const rulesView = Object.create(view, {
    dispatch: {
      value: (tr: Transaction): void => {
        if (!keepLineEnding) {
          // Before dispatching, and on the same transaction as the undo
          // record, so that undoInputRule reverts the deletion too
          deleteInsertedLineEnding(tr, to);
        }
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
  const inputRulesPlugin = recordInputRanges(inputRules({ rules }));
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
    enterRules.length > 0
      ? recordInputRanges(inputRules({ rules: enterRules }))
      : null;
  const otherRulesPlugin =
    otherRules.length > 0
      ? recordInputRanges(inputRules({ rules: otherRules }))
      : null;
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
        // An EnterInputRule's handler is always a function, and as Enter
        // isn't handled any further, a line ending it inserts is meant to
        // stay
        runRulesOnEnter(enterRulesPlugin, inputRulesPlugin, view, true)
      ) {
        return true;
      }
      if (otherRulesPlugin !== null) {
        runRulesOnEnter(otherRulesPlugin, inputRulesPlugin, view, false);
      }
    }
    return originalHandleKeyDown?.(view, event);
  };
  return inputRulesPlugin;
}
