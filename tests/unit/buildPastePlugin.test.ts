import type { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node as UnistNode } from "unist";

import {
  type Node as ProseMirrorNode,
  type ResolvedPos,
  Schema,
  type Slice,
} from "prosemirror-model";
import { expect, type Mock, type Mocked, test, vi } from "vitest";

import type { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";

import { buildPastePlugin } from "../../src/buildPastePlugin";

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

const schema = new Schema({
  marks: {
    bold: {},
    code: { code: true, excludes: "_" },
    italic: {},
    link: { attrs: { href: {} } },
  },
  nodes: {
    codeBlock: { content: "text*", group: "block", marks: "" },
    doc: { content: "block+" },
    mention: { content: "text*", group: "inline", inline: true },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline" },
  },
});

const unistRoot: UnistNode = { type: "root" };

const setup = (
  converted: Error | ProseMirrorNode | null = null,
): {
  converter: Mocked<UnistToProseMirrorConverter>;
  parseToUnist: Mock<(source: string) => UnistNode>;
  plugin: Plugin;
} => {
  const converter = {
    convertKeepingSource: vi.fn<
      (unist: UnistNode, source: string) => ProseMirrorNode | null
    >(() => {
      if (converted instanceof Error) {
        throw converted;
      }
      return converted;
    }),
  } as unknown as Mocked<UnistToProseMirrorConverter>;
  const parseToUnist = vi.fn<(source: string) => UnistNode>(() => unistRoot);
  const plugin = buildPastePlugin(converter, parseToUnist);
  return { converter, parseToUnist, plugin };
};

const paste = (
  plugin: Plugin,
  text: string,
  $context: ResolvedPos,
  plain = false,
): Slice | null | undefined =>
  plugin.props.clipboardTextParser?.call(
    plugin,
    text,
    $context,
    plain,
    {} as EditorView,
  );

const emptyDoc = schema.nodes.doc.create({}, [schema.nodes.paragraph.create()]);

test("Parses pasted text", () => {
  const pastedDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [schema.text("PARSED")]),
  ]);
  const { converter, parseToUnist, plugin } = setup(pastedDoc);

  const slice = paste(plugin, "SOURCE INPUT\n", emptyDoc.resolve(1));

  expect(slice?.content).toBe(pastedDoc.content);
  expect(slice?.openStart).toBe(0);
  expect(slice?.openEnd).toBe(0);
  expect(parseToUnist).toHaveBeenCalledWith("SOURCE INPUT");
  expect(converter.convertKeepingSource).toHaveBeenCalledWith(
    unistRoot,
    "SOURCE INPUT",
  );
});

test("Normalises line breaks in pasted text", () => {
  const { parseToUnist, plugin } = setup();

  for (const text of ["A\r\n", "B\n\n", "C", "D\r\nE\rF"]) {
    paste(plugin, text, emptyDoc.resolve(1));
  }

  expect(parseToUnist.mock.calls).toStrictEqual([
    ["A"],
    ["B\n"],
    ["C"],
    ["D\nE\nF"],
  ]);
});

test("Leaves pasted whitespace to ProseMirror", () => {
  expect.assertions(8);

  const { parseToUnist, plugin } = setup();

  for (const text of ["", "\n", "\r\n", "\n\n", " ", "\t\n", " \r\n \r\n"]) {
    expect(paste(plugin, text, emptyDoc.resolve(1))).toBeNull();
  }

  expect(parseToUnist).not.toHaveBeenCalled();
});

test("Leaves text pasted as plain text to ProseMirror", () => {
  const { parseToUnist, plugin } = setup();

  expect(paste(plugin, "SOURCE INPUT", emptyDoc.resolve(1), true)).toBeNull();
  expect(parseToUnist).not.toHaveBeenCalled();
});

test("Leaves pasted text that fails to convert to ProseMirror", () => {
  const { plugin } = setup(null);

  expect(paste(plugin, "SOURCE INPUT", emptyDoc.resolve(1))).toBeNull();
});

test("Inserts a line pasted into a code mark as it is", () => {
  const bold = schema.marks.bold.create();
  const code = schema.marks.code.create();
  const editorDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [
      schema.text("Hello", [code]),
      schema.text("World", [bold]),
    ]),
  ]);
  const pastedDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [schema.text("PARSED")]),
  ]);
  const { parseToUnist, plugin } = setup(pastedDoc);

  const slice = paste(plugin, "**SOURCE** INPUT\r\n", editorDoc.resolve(3));

  expect(
    slice?.content.eq(
      schema.nodes.paragraph.create({}, [
        schema.text("**SOURCE** INPUT", [code]),
      ]).content,
    ),
  ).toBe(true);
  expect(slice?.openStart).toBe(0);
  expect(slice?.openEnd).toBe(0);
  expect(
    paste(plugin, " ", editorDoc.resolve(3))?.content.eq(
      schema.nodes.paragraph.create({}, [schema.text(" ", [code])]).content,
    ),
  ).toBe(true);
  expect(parseToUnist).not.toHaveBeenCalled();

  expect(
    paste(plugin, "SOURCE INPUT", editorDoc.resolve(9))?.content.eq(
      schema.nodes.doc.create({}, [
        schema.nodes.paragraph.create({}, [schema.text("PARSED", [bold])]),
      ]).content,
    ),
  ).toBe(true);
  expect(parseToUnist).toHaveBeenCalledWith("SOURCE INPUT");
});

test("Leaves lines pasted into a code mark to ProseMirror", () => {
  expect.assertions(4);

  const code = schema.marks.code.create();
  const editorDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [schema.text("Hello", [code])]),
  ]);
  const { parseToUnist, plugin } = setup();

  for (const text of ["", "\n", "A\nB"]) {
    expect(paste(plugin, text, editorDoc.resolve(3))).toBeNull();
  }

  expect(parseToUnist).not.toHaveBeenCalled();
});

test("Reports errors thrown while parsing pasted text", () => {
  const { plugin } = setup(new Error("Extension bug"));

  vi.spyOn(console, "error").mockImplementation(() => {});

  expect(paste(plugin, "SOURCE INPUT", emptyDoc.resolve(1))).toBeNull();
  expect(console.error).toHaveBeenCalledWith(new Error("Extension bug"));
});

test("Keeps the marks at the cursor in pasted text", () => {
  const bold = schema.marks.bold.create();
  const italic = schema.marks.italic.create();
  const editorDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [schema.text("Hello", [bold])]),
  ]);
  const { plugin } = setup(
    schema.nodes.doc.create({}, [
      schema.nodes.paragraph.create({}, [
        schema.text("A"),
        schema.text("B", [italic]),
        schema.nodes.mention.create({}, [schema.text("C")]),
      ]),
      schema.nodes.codeBlock.create({}, [schema.text("D")]),
    ]),
  );

  const slice = paste(plugin, "SOURCE INPUT", editorDoc.resolve(3));

  expect(
    slice?.content.eq(
      schema.nodes.doc.create({}, [
        schema.nodes.paragraph.create({}, [
          schema.text("A", [bold]),
          schema.text("B", [bold, italic]),
          schema.nodes.mention.create({}, [schema.text("C", [bold])], [bold]),
        ]),
        schema.nodes.codeBlock.create({}, [schema.text("D")]),
      ]).content,
    ),
  ).toBe(true);
});

test("Prefers the pasted marks over the marks at the cursor", () => {
  const bold = schema.marks.bold.create();
  const code = schema.marks.code.create();
  const cursorLink = schema.marks.link.create({ href: "/x" });
  const pastedLink = schema.marks.link.create({ href: "/y" });
  const editorDoc = schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [
      schema.text("Hello", [bold, cursorLink]),
    ]),
  ]);
  const { plugin } = setup(
    schema.nodes.doc.create({}, [
      schema.nodes.paragraph.create({}, [
        schema.text("A", [pastedLink]),
        schema.text("B", [code]),
      ]),
    ]),
  );

  const slice = paste(plugin, "SOURCE INPUT", editorDoc.resolve(3));

  expect(
    slice?.content.eq(
      schema.nodes.doc.create({}, [
        schema.nodes.paragraph.create({}, [
          schema.text("A", [bold, pastedLink]),
          schema.text("B", [code]),
        ]),
      ]).content,
    ),
  ).toBe(true);
});

/* eslint-enable */
