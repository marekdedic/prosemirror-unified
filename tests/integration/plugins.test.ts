import { type Command, Plugin, PluginKey } from "prosemirror-state";
import { builders } from "prosemirror-test-builder";
import { expect, test } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { Extension } from "../../src/Extension";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension, type UnistRoot } from "./RootExtension";
import { TextExtension } from "./TextExtension";

const changeCountKey = new PluginKey<number>("changeCount");

// A keyed plugin, which EditorState rejects if it is added twice.
class ChangeCountExtension extends Extension {
  public override proseMirrorPlugins(): Array<Plugin> {
    return [
      new Plugin<number>({
        key: changeCountKey,
        state: {
          apply: (tr, count): number => (tr.docChanged ? count + 1 : count),
          init: (): number => 0,
        },
      }),
    ];
  }
}

class EnterGuardExtension extends Extension {
  public override proseMirrorPlugins(): Array<Plugin> {
    return [
      new Plugin({
        props: {
          handleKeyDown: (_, event): boolean => event.key === "Enter",
        },
      }),
    ];
  }
}

class ExclaimingParagraphExtension extends ParagraphExtension {
  public override proseMirrorKeymap(): Record<string, Command> {
    return {
      Enter: (state, dispatch): boolean => {
        dispatch?.(state.tr.insertText("!"));
        return true;
      },
    };
  }
}

class FirstDependentExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new ChangeCountExtension()];
  }
}

class SecondDependentExtension extends Extension {
  public override dependencies(): Array<Extension> {
    return [new ChangeCountExtension()];
  }
}

const emptyTree: UnistRoot = { children: [], type: "root" };

test("Extensions contribute plugins to the editor", () => {
  const pmu = new ProseMirrorUnified([
    new ParserProviderExtension(emptyTree, ""),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
    new FirstDependentExtension(),
    new SecondDependentExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  // The plugin of the shared dependency is added only once, otherwise
  // EditorState would reject the duplicate key.
  const testEditor = renderProseMirror(doc(paragraph("Hello")), {
    editorProps: { plugins: pmu.plugins() },
  });
  testEditor.command((state, dispatch): boolean => {
    dispatch?.(state.tr.insertText(" World", state.doc.content.size - 1));
    return true;
  });

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello World")));
  expect(changeCountKey.getState(testEditor.state)).toBe(1);
});

test("Extension plugins handle keys before the base keymap", () => {
  const pmu = new ProseMirrorUnified([
    new ParserProviderExtension(emptyTree, ""),
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
    new EnterGuardExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  const testEditor = renderProseMirror(doc(paragraph("Hello")), {
    editorProps: { plugins: pmu.plugins() },
  });
  testEditor.setSelection("end");
  testEditor.type("{Enter}");

  // Without the extension's plugin, the base keymap would split the paragraph.
  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello")));
});

test("Extension keymaps handle keys before extension plugins", () => {
  const pmu = new ProseMirrorUnified([
    new ParserProviderExtension(emptyTree, ""),
    new RootExtension(),
    new TextExtension(),
    new ExclaimingParagraphExtension(),
    new EnterGuardExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  const testEditor = renderProseMirror(doc(paragraph("Hello")), {
    editorProps: { plugins: pmu.plugins() },
  });
  testEditor.setSelection("end");
  testEditor.type("{Enter}");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello!")));
});

test("All plugins include the paste plugin", () => {
  const parserProvider = new ParserProviderExtension(
    {
      children: [
        { children: [{ type: "text", value: "World" }], type: "paragraph" },
      ],
      type: "root",
    } as UnistRoot,
    "",
  );
  const pmu = new ProseMirrorUnified([
    parserProvider,
    new RootExtension(),
    new TextExtension(),
    new ParagraphExtension(),
  ]);
  const { doc, paragraph } = builders(pmu.schema());

  const testEditor = renderProseMirror(doc(paragraph("Hello ")), {
    editorProps: { plugins: pmu.plugins() },
  });
  testEditor.setSelection("end");
  testEditor.paste("World");

  expect(testEditor.doc).toEqualProseMirrorNode(doc(paragraph("Hello World")));
  expect(parserProvider.parsed).toStrictEqual(["World"]);
});
