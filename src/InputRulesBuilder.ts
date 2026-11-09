import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";

import { type InputRule, inputRules } from "prosemirror-inputrules";

import type { ExtensionManager } from "./ExtensionManager";

export class InputRulesBuilder {
  private readonly extensionManager: ExtensionManager;
  private plugin: Plugin | undefined;
  private readonly proseMirrorSchema: Schema<string, string>;

  public constructor(
    extensionManager: ExtensionManager,
    proseMirrorSchema: Schema<string, string>,
  ) {
    this.extensionManager = extensionManager;
    this.proseMirrorSchema = proseMirrorSchema;
  }

  /**
   * Builds the plugin on the first call only, and returns the same instance
   * from then on.
   */
  public build(): Plugin {
    this.plugin ??= this.createPlugin();
    return this.plugin;
  }

  private createPlugin(): Plugin {
    const rules = ([] as Array<InputRule>).concat.apply(
      [],
      this.extensionManager
        .syntaxExtensions()
        .map((extension) =>
          extension.proseMirrorInputRules(this.proseMirrorSchema),
        ),
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
}
