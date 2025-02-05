import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

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
    const customHandleKeyDown = function (
      this: typeof inputRulesPlugin,
      view: EditorView,
      event: KeyboardEvent,
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type --- original prosemirror api
    ): boolean | void {
      if (event.key !== "Enter") {
        return originalHandleKeyDown?.(view, event);
      }
      const { $head } = view.state.selection;
      inputRulesPlugin.props.handleTextInput?.call(
        inputRulesPlugin,
        view,
        $head.pos,
        $head.pos,
        "\n",
      );
      return originalHandleKeyDown?.(view, event);
    };
    inputRulesPlugin.props.handleKeyDown = customHandleKeyDown;
    return inputRulesPlugin;
  }
}
