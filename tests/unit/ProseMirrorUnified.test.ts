import type { NodeView } from "prosemirror-view";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { expect, type Mocked, test, vi } from "vitest";

import { Extension } from "../../src";
import { ExtensionManager } from "../../src/ExtensionManager";
import { InputRulesBuilder } from "../../src/InputRulesBuilder";
import { KeymapBuilder } from "../../src/KeymapBuilder";
import { NodeViewBuilder } from "../../src/NodeViewBuilder";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { SchemaBuilder } from "../../src/SchemaBuilder";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";

vi.mock("../../src/ExtensionManager");
vi.mock("../../src/InputRulesBuilder");
vi.mock("../../src/KeymapBuilder");
vi.mock("../../src/NodeViewBuilder");
vi.mock("../../src/ProseMirrorToUnistConverter");
vi.mock("../../src/SchemaBuilder");
vi.mock("../../src/UnifiedBuilder");
vi.mock("../../src/UnistToProseMirrorConverter");

test("ProseMirrorUnified passes extensions to manager", () => {
  class MockExtension extends Extension {}
  const extension1 = new MockExtension();
  const extension2 = new MockExtension();

  new ProseMirrorUnified([extension1, extension2]);

  expect(ExtensionManager).toHaveBeenCalledWith([extension1, extension2]);
});

test("ProseMirrorUnified provides built schema", () => {
  const schema = new Schema<string, string>({
    nodes: {
      doc: {},
      text: {},
    },
  });

  vi.mocked(SchemaBuilder.prototype).build.mockReturnValueOnce(schema);

  const pmu = new ProseMirrorUnified();

  expect(pmu.schema()).toBe(schema);
});

test("ProseMirrorUnified provides input rules", () => {
  const plugin = inputRules({ rules: [] });
  vi.mocked(InputRulesBuilder.prototype).build.mockReturnValueOnce(plugin);

  const pmu = new ProseMirrorUnified();

  expect(pmu.inputRulesPlugin()).toBe(plugin);
});

test("ProseMirrorUnified provides a keymap", () => {
  const plugin = keymap({});
  vi.mocked(KeymapBuilder.prototype).build.mockReturnValueOnce(plugin);

  const pmu = new ProseMirrorUnified();

  expect(pmu.keymapPlugin()).toBe(plugin);
});

test("ProseMirrorUnified provides node views", () => {
  const nodeViews = {
    node1: (): NodeView => ({ dom: document.createElement("span") }),
    node2: (): NodeView => ({ dom: document.createElement("li") }),
  };
  vi.mocked(NodeViewBuilder.prototype).build.mockReturnValueOnce(nodeViews);

  const pmu = new ProseMirrorUnified();

  expect(pmu.nodeViews()).toBe(nodeViews);
});

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
