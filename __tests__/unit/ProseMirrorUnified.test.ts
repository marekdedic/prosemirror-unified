import type { Mocked } from "jest-mock";
import { mocked } from "jest-mock";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { Extension } from "../../src";
import { ExtensionManager } from "../../src/ExtensionManager";
import { InputRulesBuilder } from "../../src/InputRulesBuilder";
import { KeymapBuilder } from "../../src/KeymapBuilder";
import { ProseMirrorToUnistConverter } from "../../src/ProseMirrorToUnistConverter";
import { ProseMirrorUnified } from "../../src/ProseMirrorUnified";
import { SchemaBuilder } from "../../src/SchemaBuilder";
import { UnifiedBuilder } from "../../src/UnifiedBuilder";
import { UnistToProseMirrorConverter } from "../../src/UnistToProseMirrorConverter";

jest.mock("../../src/ExtensionManager");
jest.mock("../../src/InputRulesBuilder");
jest.mock("../../src/KeymapBuilder");
jest.mock("../../src/ProseMirrorToUnistConverter");
jest.mock("../../src/SchemaBuilder");
jest.mock("../../src/UnifiedBuilder");
jest.mock("../../src/UnistToProseMirrorConverter");

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

  mocked(SchemaBuilder).prototype.build.mockReturnValueOnce(schema);

  const pmu = new ProseMirrorUnified();

  expect(pmu.schema()).toBe(schema);
});

test("ProseMirrorUnified provides input rules", () => {
  const plugin = inputRules({ rules: [] });
  mocked(InputRulesBuilder).prototype.build.mockReturnValueOnce(plugin);

  const pmu = new ProseMirrorUnified();

  expect(pmu.inputRulesPlugin()).toBe(plugin);
});

test("ProseMirrorUnified provides a keymap", () => {
  const plugin = keymap({});
  mocked(KeymapBuilder).prototype.build.mockReturnValueOnce(plugin);

  const pmu = new ProseMirrorUnified();

  expect(pmu.keymapPlugin()).toBe(plugin);
});

test("ProseMirrorUnified parses a string", () => {
  const schema = new Schema({
    nodes: {
      doc: {},
      text: {},
    },
  });
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [])!;
  const parsedRoot = { type: "root" };
  const processedRoot = { type: "root", additional: "value" };

  const unifiedMock = {
    parse: jest.fn().mockReturnValueOnce(parsedRoot),
    runSync: jest.fn().mockReturnValueOnce(processedRoot),
  } as unknown as Mocked<
    Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>
  >;

  mocked(UnifiedBuilder).prototype.build.mockReturnValueOnce(unifiedMock);
  mocked(UnistToProseMirrorConverter).prototype.convert.mockReturnValueOnce(
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
  const rootProseMirrorNode = schema.nodes.doc.createAndFill({}, [])!;
  const rootUnistNode = { type: "root" };

  const unifiedMock = {
    stringify: jest.fn().mockReturnValueOnce("SOURCE INPUT"),
  } as unknown as Mocked<
    Processor<UnistNode, UnistNode, UnistNode, UnistNode, string>
  >;

  mocked(UnifiedBuilder).prototype.build.mockReturnValue(unifiedMock);
  mocked(ProseMirrorToUnistConverter).prototype.convert.mockReturnValueOnce(
    rootUnistNode,
  );

  const pmu = new ProseMirrorUnified();

  expect(pmu.serialize(rootProseMirrorNode)).toBe("SOURCE INPUT");
  expect(ProseMirrorToUnistConverter.prototype.convert).toHaveBeenCalledWith(
    rootProseMirrorNode,
  );
  expect(unifiedMock.stringify).toHaveBeenCalledWith(rootUnistNode);
});
