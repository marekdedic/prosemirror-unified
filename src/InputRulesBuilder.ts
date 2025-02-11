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
        );
      }
      return originalHandleKeyDown?.(view, event);
    };
    return inputRulesPlugin;
  }
}
