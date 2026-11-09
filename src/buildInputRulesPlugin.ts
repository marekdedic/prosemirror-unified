import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import { type InputRule, inputRules } from "prosemirror-inputrules";

import type { ExtensionManager } from "./ExtensionManager";

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
  const originalHandleKeyDown =
    inputRulesPlugin.props.handleKeyDown?.bind(inputRulesPlugin);
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Type from prosemirror-view
  inputRulesPlugin.props.handleKeyDown = (view, event): boolean | void => {
    if (event.key === "Enter") {
      const { from, to } = view.state.selection;
      inputRulesPlugin.props.handleTextInput?.call(
        inputRulesPlugin,
        view,
        from,
        to,
        "\n",
        () => view.state.tr,
      );
    }
    return originalHandleKeyDown?.(view, event);
  };
  return inputRulesPlugin;
}
