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
    return inputRules({ rules: this.rules });
  }
}
