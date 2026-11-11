# Migration to 1.0

The 1.0 release contains breaking changes, both for apps that use `ProseMirrorUnified` to set up an editor and for packages that provide extensions. This page lists them with the steps to migrate. Apps that only call `parse`, `serialize` and `schema` don't need to change anything.

## Apps

### Set up the editor with `plugins()`

1.0 adds a [`plugins()`](/guide/api#plugins-array-plugin) method, which returns every plugin the adapter provides, in the order they have to be in. Switch to it:

```ts
// before
EditorState.create({
  doc: pmu.parse(source),
  plugins: [pmu.inputRulesPlugin(), pmu.keymapPlugin()],
  schema: pmu.schema(),
});

// after
EditorState.create({
  doc: pmu.parse(source),
  plugins: pmu.plugins(),
  schema: pmu.schema(),
});
```

The old setup is now missing parts of the editor:

- **The base keymap.** `keymapPlugin()` used to merge the extensions' keyboard shortcuts with the [base keymap](https://prosemirror.net/docs/ref/#commands.baseKeymap) from prosemirror-commands, which binds keys such as Enter, Backspace and Mod-a. It now contains only the extensions' shortcuts, so without `plugins()` or the base keymap added by hand, those keys do nothing.
- **The extensions' own plugins.** Extensions can now contribute [ProseMirror plugins](/guide/api#extensionplugins-array-plugin), which they may need for some of their features.
- **The paste plugin.** The new [paste plugin](/guide/api#pasteplugin-plugin) parses pasted plain text the same way as `parse`, instead of inserting it as it is.

`plugins()` also picks up plugins added by new extensions or later versions, without changes to your setup.

Replace the individual methods with `plugins()` rather than adding it next to them: it contains the same plugin instances, and `EditorState` throws a `RangeError` when one is added twice.

A keymap of your own should go before `...pmu.plugins()`, because the base keymap at its end handles Enter, Backspace and the like, which would then never reach a plugin after it. See [`plugins()`](/guide/api#plugins-array-plugin) for the details.

If you want to keep the old paste behaviour, or need any other selection or order, build the list from the individual methods and add the base keymap yourself, last:

```ts
import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";

EditorState.create({
  doc: pmu.parse(source),
  plugins: [
    pmu.inputRulesPlugin(),
    pmu.keymapPlugin(),
    ...pmu.extensionPlugins(),
    keymap(baseKeymap),
  ],
  schema: pmu.schema(),
});
```

## Extension authors

### `MarkInputRule` matchers consist of four named groups

A `MarkInputRule` matcher used to need just the named groups `content` and `trailing`; the rest of the match was removed as the delimiters. Now it must consist of exactly the named groups `opening`, `content`, `closing` and `trailing`, in this order, followed by `$`, with nothing outside them. The constructor throws otherwise.

Wrap the opening and closing delimiters in groups of their own:

```ts
// before
new MarkInputRule(
  /(?<!\*)\*\*(?<content>\S(?:.*\S)?)\*\*(?<trailing>[\s\S])$/u,
  schema.marks["bold"],
);

// after
new MarkInputRule(
  /(?<opening>(?<!\*)\*\*)(?<content>\S(?:.*\S)?)(?<closing>\*\*)(?<trailing>[\s\S])$/u,
  schema.marks["bold"],
  { allowLeafNodes: true },
);
```

(See [inline leaf nodes](#inline-leaf-nodes-in-the-content) below for `allowLeafNodes`.)

Everything that used to sit outside `content` and `trailing` goes into one of the four groups:

- Lookbehinds and lookaheads around the opening delimiter go inside `opening`, and those around the closing delimiter inside `closing`.
- A condition on the text before the opening delimiter that consumed it, such as `(?:^|\s)\*`, used to delete that text along with the delimiter. Make it a lookbehind inside `opening` instead, e.g. `(?<opening>(?<=^|[\s￼])\*)`, so the text stays. (U+FFFC stands for an inline leaf node, see [below](#inline-leaf-nodes-in-the-content).)
- Groups that a backreference refers to are nested in the group they belong to, e.g. a variable-length delimiter in `opening`, with its backreference in `closing`:

  ```ts
  // before
  /(?<!`)(?<delimiter>`+)(?!`)(?<padding> ?)(?=\S)(?<content>(?:[^`]|(?!\k<delimiter>(?!`))`+(?!`))+)(?<=\S)\k<padding>\k<delimiter>(?<trailing>[^`])$/u;

  // after
  /(?<opening>(?<!`)(?<delimiter>`+)(?!`)(?<padding> ?)(?=\S))(?<content>(?:[^`]|(?!\k<delimiter>(?!`))`+(?!`))+)(?<closing>(?<=\S)\k<padding>\k<delimiter>)(?<trailing>[^`])$/u;
  ```

- An optional `trailing` group has to be optional inside: `(?<trailing>.?)` instead of `(?<trailing>.)?`. The same goes for an empty one: `(?<trailing>)` instead of `(?<trailing>)?`.

The matcher also must not have the `g`, `m` or `y` flag.

### `MarkInputRule` behaviour changes

Rules that match the new format may still behave differently than before:

- **The content is marked in place.** It used to be replaced with plain text with the marks of its first character, which dropped marks on the rest of it (e.g. a link on one word). Now the mark is added to the content as it is, and its other marks are kept.
- **Text after the rule keeps the surrounding marks.** The trailing text and whatever is typed next used to lose every mark the match started with, so e.g. typing an italic inside bold text ended the bold too. Now they keep the marks you were typing with, without the new one.
- **The rule refuses more cases**, leaving the document unchanged where it used to apply anyway:
  - the content is empty,
  - the mark can't be added to all of the content, e.g. because part of it has a mark that excludes the new one, or the parent node doesn't allow the mark,
  - the typed text replaces a selection, or an inline node with content shifts the match, so the document doesn't hold the matched text,
  - a delimiter contains an inline leaf node, which removing the delimiter would delete.

#### Inline leaf nodes in the content

ProseMirror matches input rules against the text before the cursor with every inline leaf node (an image, a hard break) replaced by U+FFFC. A rule whose `content` matched across a leaf node used to replace it with a literal U+FFFC character. Now, by default, the rule doesn't apply when `content` contains a leaf node. Pass `{ allowLeafNodes: true }` as the third argument for marks that may contain leaf nodes, such as bold; the leaf nodes are then kept and get the mark too.

If your `opening` lookbehind accepts e.g. whitespace before the delimiter, accept U+FFFC there too, so that the rule also applies right after a leaf node. See [`MarkInputRule`](/developing/extensions#markinputrule) for the full description, including the `inCode`, `inCodeMark` and `undoable` options, which are now passed through to `InputRule`.

### Input rules on Enter

Input rules already ran on Enter as if a line ending (`"\n"`) had been typed. This now only happens when Enter is pressed without a modifier key, with the selection within a single textblock, so a rule no longer applies on e.g. Shift-Enter. A `"\n"` that a rule inserts right before the cursor, for example through a string handler with a capture group, is removed again, as Enter goes on to split the block. Undoing such a rule with [`undoInputRule`](https://prosemirror.net/docs/ref/#inputrules.undoInputRule) no longer inserts a line ending.

A rule that should replace what Enter does, rather than run before it, can now be an [`EnterInputRule`](/developing/extensions#enterinputrule).

### Editor hooks are called on first use

`proseMirrorInputRules`, `proseMirrorKeymap` and `proseMirrorNodeView` used to be called in the `ProseMirrorUnified` constructor. Now they are called the first time the corresponding part is requested — e.g. `proseMirrorInputRules` when `inputRulesPlugin()` or `plugins()` is first called — and not at all by apps that only parse and serialize. An error thrown in one of them therefore surfaces in that call instead of the constructor. See [when the editor hooks are called](/developing/extensions#when-the-editor-hooks-are-called).

### `Extension` has a new `proseMirrorPlugins` method

Extensions can now contribute ProseMirror plugins through [`proseMirrorPlugins`](/developing/extensions#prosemirrorplugins-prosemirrorschema-schema-string-string-array-plugin). An extension that already has a member of that name has to rename it.
