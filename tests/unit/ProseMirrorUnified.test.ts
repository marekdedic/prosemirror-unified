import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { expect, type Mocked, test, vi } from "vitest";

import { buildExtensionPlugins } from "../../src/buildExtensionPlugins";
import { buildInputRulesPlugin } from "../../src/buildInputRulesPlugin";
import { buildKeymapPlugin } from "../../src/buildKeymapPlugin";
import { buildNodeViews } from "../../src/buildNodeViews";
import { buildPastePlugin } from "../../src/buildPastePlugin";
import { buildUnified } from "../../src/buildUnified";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";

vi.mock("../../src/buildExtensionPlugins");
vi.mock("../../src/buildInputRulesPlugin");
vi.mock("../../src/buildKeymapPlugin");
vi.mock("../../src/buildNodeViews");
vi.mock("../../src/buildPastePlugin");
vi.mock("../../src/buildSchema");
vi.mock("../../src/buildUnified");
vi.mock("../../src/ExtensionManager");
vi.mock("../../src/ProseMirrorToUnistConverter");
vi.mock("../../src/UnistToProseMirrorConverter");
vi.mock("prosemirror-keymap");

interface EditorPart {
  // The number of times the part was built.
  buildCount(): number;
  call(pmu: ProseMirrorUnified): unknown;
  // Makes the next build throw.
  failNextBuild(): void;
  // Makes every build return a new value, so that rebuilding is observable.
  mockBuild(): void;
  name: string;
}

const failure = (): never => {
  throw new Error("Failed");
};

const editorParts: Array<EditorPart> = [
  {
    buildCount: () => vi.mocked(buildExtensionPlugins).mock.calls.length,
    call: (pmu) => pmu.extensionPlugins(),
    failNextBuild: (): void => {
      vi.mocked(buildExtensionPlugins).mockImplementationOnce(failure);
    },
    mockBuild: (): void => {
      vi.mocked(buildExtensionPlugins).mockImplementation(() => [
        new Plugin({}),
      ]);
    },
    name: "extensionPlugins",
  },
  {
    buildCount: () => vi.mocked(buildInputRulesPlugin).mock.calls.length,
    call: (pmu) => pmu.inputRulesPlugin(),
    failNextBuild: (): void => {
      vi.mocked(buildInputRulesPlugin).mockImplementationOnce(failure);
    },
    mockBuild: (): void => {
      vi.mocked(buildInputRulesPlugin).mockImplementation(() => new Plugin({}));
    },
    name: "inputRulesPlugin",
  },
  {
    buildCount: () => vi.mocked(buildKeymapPlugin).mock.calls.length,
    call: (pmu) => pmu.keymapPlugin(),
    failNextBuild: (): void => {
      vi.mocked(buildKeymapPlugin).mockImplementationOnce(failure);
    },
    mockBuild: (): void => {
      vi.mocked(buildKeymapPlugin).mockImplementation(() => new Plugin({}));
    },
    name: "keymapPlugin",
  },
  {
    buildCount: () => vi.mocked(buildNodeViews).mock.calls.length,
    call: (pmu) => pmu.nodeViews(),
    failNextBuild: (): void => {
      vi.mocked(buildNodeViews).mockImplementationOnce(failure);
    },
    mockBuild: (): void => {
      vi.mocked(buildNodeViews).mockImplementation(() => ({ node: vi.fn() }));
    },
    name: "nodeViews",
  },
  {
    buildCount: () => vi.mocked(buildPastePlugin).mock.calls.length,
    call: (pmu) => pmu.pastePlugin(),
    failNextBuild: (): void => {
      vi.mocked(buildPastePlugin).mockImplementationOnce(failure);
    },
    mockBuild: (): void => {
      vi.mocked(buildPastePlugin).mockImplementation(() => new Plugin({}));
    },
    name: "pastePlugin",
  },
];

test("ProseMirrorUnified parses a string", () => {
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.create({}, []);
  const parsedRoot = { type: "root" };
  const processedRoot = { additional: "value", type: "root" };

  const unifiedMock = {
    parse: vi.fn<(file: string) => UnistNode>().mockReturnValueOnce(parsedRoot),
    runSync: vi
      .fn<(node: UnistNode) => UnistNode>()
      .mockReturnValueOnce(processedRoot),
  } as unknown as Mocked<
    Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>
  >;

  vi.mocked(buildUnified).mockReturnValueOnce(unifiedMock);
  vi.mocked(UnistToProseMirrorConverter.prototype).convert.mockReturnValueOnce(
    rootProseMirrorNode,
  );

  const pmu = new ProseMirrorUnified();

  expect(pmu.parse("SOURCE INPUT")).toBe(rootProseMirrorNode);
  expect(unifiedMock.parse).toHaveBeenCalledWith("SOURCE INPUT");
  expect(unifiedMock.runSync).toHaveBeenCalledWith(parsedRoot);
  expect(UnistToProseMirrorConverter.prototype.convert).toHaveBeenCalledWith(
    processedRoot,
  );
});

test("ProseMirrorUnified stringifies an AST", () => {
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.create({}, []);
  const rootUnistNode = { type: "root" };

  const unifiedMock = {
    stringify: vi
      .fn<(tree: UnistNode) => string>()
      .mockReturnValueOnce("SOURCE INPUT"),
  } as unknown as Mocked<
    Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>
  >;

  vi.mocked(buildUnified).mockReturnValue(unifiedMock);
  vi.mocked(ProseMirrorToUnistConverter.prototype).convert.mockReturnValueOnce(
    rootUnistNode,
  );

  const pmu = new ProseMirrorUnified();

  expect(pmu.serialize(rootProseMirrorNode)).toBe("SOURCE INPUT");
  expect(ProseMirrorToUnistConverter.prototype.convert).toHaveBeenCalledWith(
    rootProseMirrorNode,
  );
  expect(unifiedMock.stringify).toHaveBeenCalledWith(rootUnistNode);
});

test("ProseMirrorUnified returns all plugins", () => {
  const inputRulesPlugin = new Plugin({});
  const extensionPlugins = [new Plugin({}), new Plugin({})];
  const pastePlugin = new Plugin({});
  const keymapPlugin = new Plugin({});
  const baseKeymapPlugin = new Plugin({});

  vi.mocked(buildInputRulesPlugin).mockReturnValue(inputRulesPlugin);
  vi.mocked(buildExtensionPlugins).mockReturnValue(extensionPlugins);
  vi.mocked(buildPastePlugin).mockReturnValue(pastePlugin);
  vi.mocked(buildKeymapPlugin).mockReturnValue(keymapPlugin);
  vi.mocked(keymap).mockReturnValue(baseKeymapPlugin);

  const pmu = new ProseMirrorUnified();

  expect(pmu.extensionPlugins()).toStrictEqual(extensionPlugins);
  expect(pmu.plugins()).toStrictEqual([
    inputRulesPlugin,
    keymapPlugin,
    ...extensionPlugins,
    pastePlugin,
    baseKeymapPlugin,
  ]);
  expect(keymap).toHaveBeenCalledWith(baseKeymap);
});

test.each(editorParts)(
  "ProseMirrorUnified builds $name() once, on the first call",
  ({ buildCount, call, mockBuild }) => {
    mockBuild();

    const pmu = new ProseMirrorUnified();

    expect(buildCount()).toBe(0);

    const result = call(pmu);

    expect(call(pmu)).toStrictEqual(result);
    expect(buildCount()).toBe(1);
  },
);

test.each(editorParts)(
  "ProseMirrorUnified builds $name() again after the build throws",
  ({ buildCount, call, failNextBuild, mockBuild }) => {
    mockBuild();
    failNextBuild();

    const pmu = new ProseMirrorUnified();

    expect(() => call(pmu)).toThrow("Failed");

    const result = call(pmu);

    expect(call(pmu)).toStrictEqual(result);
    expect(buildCount()).toBe(2);
  },
);

test("ProseMirrorUnified builds the base keymap once, on the first call", () => {
  const baseKeymapPlugin = new Plugin({});
  vi.mocked(buildExtensionPlugins).mockReturnValue([]);
  vi.mocked(keymap).mockReturnValue(baseKeymapPlugin);

  const pmu = new ProseMirrorUnified();

  expect(keymap).not.toHaveBeenCalled();

  const plugins = pmu.plugins();
  const pluginsAgain = pmu.plugins();

  expect(pluginsAgain).not.toBe(plugins);
  expect(pluginsAgain[pluginsAgain.length - 1]).toBe(baseKeymapPlugin);
  expect(keymap).toHaveBeenCalledExactlyOnceWith(baseKeymap);
});

test("ProseMirrorUnified returns a new array of extension plugins each time", () => {
  const plugin = new Plugin({});
  vi.mocked(buildExtensionPlugins).mockReturnValue([plugin]);

  const pmu = new ProseMirrorUnified();
  const plugins = pmu.extensionPlugins();
  plugins.pop();

  expect(pmu.extensionPlugins()).toStrictEqual([plugin]);
});

test("ProseMirrorUnified returns a new object of node views each time", () => {
  const nodeView = vi.fn();
  vi.mocked(buildNodeViews).mockReturnValue({ node: nodeView });

  const pmu = new ProseMirrorUnified();
  const nodeViews = pmu.nodeViews();
  delete nodeViews["node"];

  expect(pmu.nodeViews()).toStrictEqual({ node: nodeView });
});
