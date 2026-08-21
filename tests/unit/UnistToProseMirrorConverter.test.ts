import { type Mark, Schema } from "prosemirror-model";
import { expect, test, vi } from "vitest";

import { ExtensionManager } from "../../src/ExtensionManager";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";
import { MockSyntaxExtension } from "../mocks/MockSyntaxExtension";

vi.mock("../../src/ExtensionManager");
vi.mock("../../src/SyntaxExtension");

/* eslint-disable @typescript-eslint/no-empty-function, no-console -- Testing console output */

test("Converts basic document", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes["doc"].create({}, []);

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockReturnValueOnce(true);
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = { children: [], type: "root" };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);
  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {
        content: "text*",
      },
      text: {},
    },
  });
  const textProseMirrorNode = schema.text("Hello World!");
  const rootProseMirrorNode = schema.nodes["doc"].create({}, [
    textProseMirrorNode,
  ]);

  const textExtension = vi.mocked(new MockSyntaxExtension());
  textExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "text",
  );
  textExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    textProseMirrorNode,
  ]);

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const textUnistNode = { type: "text", value: "Hello World!" };
  const rootUnistNode = { children: [textUnistNode], type: "root" };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);
  expect(textExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    textUnistNode,
  );
  expect(textExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    textUnistNode,
    schema,
    [],
    {},
  );
  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [textProseMirrorNode],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a document with children of multiple types", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      text: {},
      typeOne: {
        group: "groupOne",
      },
      typeThree: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
    },
  });
  const typeOneProseMirrorNode = schema.nodes["typeOne"].create({}, []);
  const typeTwoProseMirrorNode = schema.nodes["typeTwo"].create({}, []);
  const rootProseMirrorNode = schema.nodes["doc"].create({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ]);

  const typeOneExtension = vi.mocked(new MockSyntaxExtension());
  typeOneExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "one",
  );
  typeOneExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeOneProseMirrorNode,
  ]);

  const typeTwoExtension = vi.mocked(new MockSyntaxExtension());
  typeTwoExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "two",
  );
  typeTwoExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeTwoProseMirrorNode,
  ]);

  const typeThreeExtension = vi.mocked(new MockSyntaxExtension());
  typeThreeExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "three",
  );

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([
    docExtension,
    typeOneExtension,
    typeTwoExtension,
    typeThreeExtension,
  ]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const typeOneUnistNode = { type: "one" };
  const typeTwoUnistNode = { type: "two" };
  const rootUnistNode = {
    children: [typeOneUnistNode, typeTwoUnistNode],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);

  expect(typeOneExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeOneUnistNode,
  );
  expect(typeOneExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeOneUnistNode,
    schema,
    [],
    {},
  );

  expect(typeTwoExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeTwoUnistNode,
  );
  expect(typeTwoExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeTwoUnistNode,
    schema,
    [],
    {},
  );

  expect(typeThreeExtension.unistNodeToProseMirrorNodes).not.toHaveBeenCalled();

  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [typeOneProseMirrorNode, typeTwoProseMirrorNode],
    {},
  );
  expect(console.warn).not.toHaveBeenCalled();
});

test("Fails gracefully on no root converter", () => {
  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([]);

  const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = { children: [], type: "root" };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(() => converter.convert(rootUnistNode)).toThrow(
    "Couldn't find any way to convert the root unist node.",
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "root" to a ProseMirror node.',
  );
});

test("Converts a document with invalid children", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {
        content: "groupOne*",
      },
      text: {},
      typeOne: {
        group: "groupOne",
      },
      typeTwo: {
        group: "groupOne",
      },
    },
  });
  const typeOneProseMirrorNode = schema.nodes["typeOne"].create({}, []);
  const typeTwoProseMirrorNode = schema.nodes["typeTwo"].create({}, []);
  const rootProseMirrorNode = schema.nodes["doc"].create({}, [
    typeOneProseMirrorNode,
    typeTwoProseMirrorNode,
  ]);

  const typeOneExtension = vi.mocked(new MockSyntaxExtension());
  typeOneExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "one",
  );
  typeOneExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    typeOneProseMirrorNode,
  ]);

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, typeOneExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const typeOneUnistNode = { type: "one" };
  const typeTwoUnistNode = { type: "two" };
  const rootUnistNode = {
    children: [typeOneUnistNode, typeTwoUnistNode],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(converter.convert(rootUnistNode)).toBe(rootProseMirrorNode);

  expect(typeOneExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    typeOneUnistNode,
  );
  expect(typeOneExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    typeOneUnistNode,
    schema,
    [],
    {},
  );

  expect(docExtension.unistToProseMirrorTest).toHaveBeenCalledWith(
    rootUnistNode,
  );
  expect(docExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledWith(
    rootUnistNode,
    schema,
    [typeOneProseMirrorNode],
    {},
  );
  expect(console.warn).toHaveBeenCalledWith(
    'Couldn\'t find any way to convert unist node of type "two" to a ProseMirror node.',
  );
});

test("Runs the post-conversion hook of every syntax extension", () => {
  expect.assertions(6);

  const schema = new Schema<string, string>({
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });
  const textProseMirrorNode = schema.text("Hello World!");
  const rootProseMirrorNode = schema.nodes["doc"].create({}, [
    textProseMirrorNode,
  ]);

  const textExtension = vi.mocked(new MockSyntaxExtension());
  textExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "text",
  );
  textExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    textProseMirrorNode,
  ]);

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockReturnValueOnce([
    rootProseMirrorNode,
  ]);

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [{ type: "text", value: "Hello World!" }],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  converter.convert(rootUnistNode);

  expect(docExtension.postUnistToProseMirrorHook).toHaveBeenCalledTimes(1);
  expect(docExtension.postUnistToProseMirrorHook).toHaveBeenCalledWith({});
  expect(textExtension.postUnistToProseMirrorHook).toHaveBeenCalledTimes(1);
  expect(textExtension.postUnistToProseMirrorHook).toHaveBeenCalledWith({});

  // The hooks only run once the whole tree has been converted.
  expect(
    textExtension.postUnistToProseMirrorHook.mock.invocationCallOrder[0],
  ).toBeGreaterThan(
    docExtension.unistNodeToProseMirrorNodes.mock.invocationCallOrder[0],
  );
  expect(console.warn).not.toHaveBeenCalled();
});

interface ReferenceContext extends Record<string, unknown> {
  definitions: Record<string, string>;
  marks: Record<string, Mark>;
}

test("Applies post-conversion hook changes to the converted document", () => {
  expect.assertions(4);

  const schema = new Schema<string, string>({
    marks: {
      link: { attrs: { href: { default: null } } },
    },
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });

  // Mimics the reference/definition pattern: the mark is created with a
  // Placeholder attribute that only the hook can fill in.
  const referenceExtension = vi.mocked(
    new MockSyntaxExtension<{ type: "reference" }, ReferenceContext>(),
  );
  referenceExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "reference",
  );
  referenceExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, _convertedChildren, context) => {
      const mark = proseMirrorSchema.marks["link"].create({ href: null });
      context.marks ??= {};
      context.marks["ID"] = mark;
      return [proseMirrorSchema.text("Hello World!").mark([mark])];
    },
  );
  referenceExtension.postUnistToProseMirrorHook.mockImplementation(
    (context) => {
      for (const [id, mark] of Object.entries(context.marks ?? {})) {
        (mark.attrs as Record<string, unknown>)["href"] =
          context.definitions?.[id];
      }
    },
  );

  // The definition is only encountered after the reference that needs it.
  const definitionExtension = vi.mocked(
    new MockSyntaxExtension<{ type: "definition" }, ReferenceContext>(),
  );
  definitionExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "definition",
  );
  definitionExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, _proseMirrorSchema, _convertedChildren, context) => {
      context.definitions ??= {};
      context.definitions["ID"] = "https://example.com";
      return [];
    },
  );

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren) => [
      proseMirrorSchema.nodes["doc"].create({}, convertedChildren),
    ],
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([
    docExtension,
    referenceExtension,
    definitionExtension,
  ]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [{ type: "reference" }, { type: "definition" }],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  const converted = converter.convert(rootUnistNode);

  expect(converted.childCount).toBe(1);
  expect(converted.child(0).marks).toHaveLength(1);
  expect(converted.child(0).marks[0].attrs["href"]).toBe("https://example.com");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Shares a single context object with every extension", () => {
  expect.assertions(6);

  const schema = new Schema<string, string>({
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });
  const contexts: Array<Partial<Record<string, unknown>>> = [];

  const textExtension = vi.mocked(new MockSyntaxExtension());
  textExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "text",
  );
  textExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, _convertedChildren, context) => {
      contexts.push(context);
      return [proseMirrorSchema.text("Hello World!")];
    },
  );
  textExtension.postUnistToProseMirrorHook.mockImplementation((context) => {
    contexts.push(context);
  });

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren, context) => {
      contexts.push(context);
      return [proseMirrorSchema.nodes["doc"].create({}, convertedChildren)];
    },
  );
  docExtension.postUnistToProseMirrorHook.mockImplementation((context) => {
    contexts.push(context);
  });

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, textExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [
      { type: "text", value: "Hello" },
      { type: "text", value: "World" },
    ],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  converter.convert(rootUnistNode);

  // Two text nodes, the root node and one hook per extension.
  expect(contexts).toHaveLength(5);

  for (const context of contexts) {
    expect(context).toBe(contexts[0]);
  }
});

test("Makes context changes visible to extensions converting later nodes", () => {
  expect.assertions(3);

  const schema = new Schema<string, string>({
    nodes: {
      doc: { content: "paragraph+" },
      paragraph: { content: "text*" },
      text: {},
    },
  });

  const writerExtension = vi.mocked(new MockSyntaxExtension());
  writerExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "writer",
  );
  writerExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, _convertedChildren, context) => {
      (context as Record<string, unknown>)["value"] = "WRITTEN";
      return [proseMirrorSchema.text("writer")];
    },
  );

  // Snapshots are needed because the context is mutated further after the call.
  const readerSnapshots: Array<Record<string, unknown>> = [];
  const readerExtension = vi.mocked(new MockSyntaxExtension());
  readerExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "reader",
  );
  readerExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, _convertedChildren, context) => {
      readerSnapshots.push({ ...context });
      return [proseMirrorSchema.text("reader")];
    },
  );

  const paragraphSnapshots: Array<Record<string, unknown>> = [];
  const paragraphExtension = vi.mocked(new MockSyntaxExtension());
  paragraphExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "paragraph",
  );
  paragraphExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren, context) => {
      paragraphSnapshots.push({ ...context });
      return [
        proseMirrorSchema.nodes["paragraph"].create({}, convertedChildren),
      ];
    },
  );

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren) => [
      proseMirrorSchema.nodes["doc"].create({}, convertedChildren),
    ],
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([
    docExtension,
    paragraphExtension,
    writerExtension,
    readerExtension,
  ]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [
      { children: [{ type: "writer" }], type: "paragraph" },
      { children: [{ type: "reader" }], type: "paragraph" },
    ],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  converter.convert(rootUnistNode);

  // A parent sees what its own children wrote.
  expect(paragraphSnapshots[0]["value"]).toBe("WRITTEN");
  // A node sees what an earlier subtree wrote.
  expect(readerSnapshots[0]["value"]).toBe("WRITTEN");
  expect(console.warn).not.toHaveBeenCalled();
});

test("Starts every conversion with an empty context", () => {
  expect.assertions(3);

  const schema = new Schema<string, string>({
    nodes: {
      doc: {},
      text: {},
    },
  });

  const snapshots: Array<Record<string, unknown>> = [];
  const contexts: Array<Partial<Record<string, unknown>>> = [];
  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, _convertedChildren, context) => {
      snapshots.push({ ...context });
      contexts.push(context);
      (context as Record<string, unknown>)["value"] = "WRITTEN";
      return [proseMirrorSchema.nodes["doc"].create({}, [])];
    },
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = { children: [], type: "root" };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  converter.convert(rootUnistNode);
  converter.convert(rootUnistNode);

  expect(snapshots[0]).toStrictEqual({});
  // The second conversion must not see what the first one wrote.
  expect(snapshots[1]).toStrictEqual({});
  expect(contexts[1]).not.toBe(contexts[0]);
});

test("Converts a node that produces no ProseMirror nodes", () => {
  expect.assertions(4);

  const schema = new Schema<string, string>({
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });

  // Mimics a definition: the node only records something in the context and
  // Contributes nothing to the document itself.
  const definitionExtension = vi.mocked(new MockSyntaxExtension());
  definitionExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "definition",
  );
  definitionExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, _proseMirrorSchema, _convertedChildren, context) => {
      (context as Record<string, unknown>)["value"] = "WRITTEN";
      return [];
    },
  );

  const textExtension = vi.mocked(new MockSyntaxExtension());
  textExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "text",
  );
  textExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema) => [proseMirrorSchema.text("Hello World!")],
  );

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren) => [
      proseMirrorSchema.nodes["doc"].create({}, convertedChildren),
    ],
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([
    docExtension,
    definitionExtension,
    textExtension,
  ]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [{ type: "definition" }, { type: "text", value: "Hello World!" }],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  const converted = converter.convert(rootUnistNode);

  expect(converted.childCount).toBe(1);
  expect(converted.child(0).text).toBe("Hello World!");
  expect(definitionExtension.unistNodeToProseMirrorNodes).toHaveBeenCalledTimes(
    1,
  );
  // Converting to nothing is intentional and must not be reported.
  expect(console.warn).not.toHaveBeenCalled();
});

test("Converts a node into multiple ProseMirror nodes", () => {
  expect.assertions(4);

  const schema = new Schema<string, string>({
    nodes: {
      doc: { content: "text*" },
      text: {},
    },
  });

  const splittingExtension = vi.mocked(new MockSyntaxExtension());
  splittingExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "splitting",
  );
  splittingExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema) => [
      proseMirrorSchema.text("Hello "),
      proseMirrorSchema.text("World!"),
    ],
  );

  const docExtension = vi.mocked(new MockSyntaxExtension());
  docExtension.unistToProseMirrorTest.mockImplementation(
    (node) => node.type === "root",
  );
  docExtension.unistNodeToProseMirrorNodes.mockImplementation(
    (_node, proseMirrorSchema, convertedChildren) => [
      proseMirrorSchema.nodes["doc"].create({}, convertedChildren),
    ],
  );

  const manager = vi.mocked(new ExtensionManager([]));
  manager.syntaxExtensions.mockReturnValue([docExtension, splittingExtension]);

  const converter = new UnistToProseMirrorConverter(manager, schema);

  const rootUnistNode = {
    children: [{ type: "splitting" }, { type: "splitting" }],
    type: "root",
  };

  vi.spyOn(console, "warn").mockImplementation(() => {});

  const converted = converter.convert(rootUnistNode);

  // Both nodes of both children end up flattened into the parent.
  expect(
    docExtension.unistNodeToProseMirrorNodes.mock.calls[0][2],
  ).toHaveLength(4);
  expect(
    docExtension.unistNodeToProseMirrorNodes.mock.calls[0][2][1].text,
  ).toBe("World!");
  // ProseMirror joins the adjacent text nodes back together.
  expect(converted.textContent).toBe("Hello World!Hello World!");
  expect(console.warn).not.toHaveBeenCalled();
});

/* eslint-enable */
