import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { expect, type Mocked, test, vi } from "vitest";

import { InputRulesBuilder } from "../../src/InputRulesBuilder";
import { KeymapBuilder } from "../../src/KeymapBuilder";
import { PastePluginBuilder } from "../../src/PastePluginBuilder";
import { PluginsBuilder } from "../../src/PluginsBuilder";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";

vi.mock("../../src/ExtensionManager");
vi.mock("../../src/InputRulesBuilder");
vi.mock("../../src/KeymapBuilder");
vi.mock("../../src/NodeViewBuilder");
vi.mock("../../src/PastePluginBuilder");
vi.mock("../../src/PluginsBuilder");
vi.mock("../../src/ProseMirrorToUnistConverter");
vi.mock("../../src/SchemaBuilder");
vi.mock("../../src/UnifiedBuilder");
vi.mock("../../src/UnistToProseMirrorConverter");
vi.mock("prosemirror-keymap");

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

  vi.mocked(UnifiedBuilder.prototype).build.mockReturnValueOnce(unifiedMock);
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

  vi.mocked(UnifiedBuilder.prototype).build.mockReturnValue(unifiedMock);
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

  vi.mocked(InputRulesBuilder.prototype).build.mockReturnValue(
    inputRulesPlugin,
  );
  vi.mocked(PluginsBuilder.prototype).build.mockReturnValue(extensionPlugins);
  vi.mocked(PastePluginBuilder.prototype).build.mockReturnValue(pastePlugin);
  vi.mocked(KeymapBuilder.prototype).build.mockReturnValue(keymapPlugin);
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
