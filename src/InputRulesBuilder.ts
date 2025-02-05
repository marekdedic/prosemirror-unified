import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import { type InputRule, inputRules } from "prosemirror-inputrules";

import type { ExtensionManager } from "./ExtensionManager";

export class InputRulesBuilder {
  private readonly rules: Array<InputRule>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.rules = ([] as Array<InputRule>).concat.apply(
      [],
      extensionManager
        .syntaxExtensions()
        .map((extension) => extension.proseMirrorInputRules(proseMirrorSchema)),
    );
  }

  public build(): Plugin {
    const inputRulesPlugin = inputRules({ rules: this.rules });
    const originalHandleKeyDown =
      inputRulesPlugin.props.handleKeyDown?.bind(inputRulesPlugin);
    const customHandleKeyDown: Exclude<
      typeof originalHandleKeyDown,
      undefined
    > = (view, event) => {
      if (event.key === "Enter") {
        const { from, to } = view.state.selection;
        inputRulesPlugin.props.handleTextInput?.call(
          inputRulesPlugin,
          view,
          from,
          to,
          "\n",
        );
      }
      return originalHandleKeyDown?.(view, event);
    };
    inputRulesPlugin.props.handleKeyDown = customHandleKeyDown;
    return inputRulesPlugin;
  }
}
