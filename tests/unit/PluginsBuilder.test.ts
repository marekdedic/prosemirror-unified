import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { expect, test, vi } from "vitest";

import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
import { PluginsBuilder } from "../../src/PluginsBuilder";
import { MockMarkExtension } from "../mocks/MockMarkExtension";
import { MockNodeExtension } from "../mocks/MockNodeExtension";

const schema = new Schema<string, string>({ nodes: { doc: {}, text: {} } });

class MarkPluginExtension extends MockMarkExtension<{ type: "mark" }> {
  public override proseMirrorPlugins = vi.fn<() => Array<Plugin>>(() => []);
}

class NodePluginExtension extends MockNodeExtension<{ type: "node" }> {
  public override proseMirrorPlugins = vi.fn<() => Array<Plugin>>(() => []);
}

class OtherPluginExtension extends Extension {
  public override proseMirrorPlugins = vi.fn<() => Array<Plugin>>(() => []);
}

test("PluginsBuilder collects the plugins of all extensions", () => {
  const nodePlugins = [new Plugin({}), new Plugin({})];
  const markPlugin = new Plugin({});
  const otherPlugin = new Plugin({});

  const nodeExtension = new NodePluginExtension();
  nodeExtension.proseMirrorPlugins.mockReturnValueOnce(nodePlugins);
  const markExtension = new MarkPluginExtension();
  markExtension.proseMirrorPlugins.mockReturnValueOnce([markPlugin]);
  const otherExtension = new OtherPluginExtension();
  otherExtension.proseMirrorPlugins.mockReturnValueOnce([otherPlugin]);

  const builder = new PluginsBuilder(
    new ExtensionManager([otherExtension, markExtension, nodeExtension]),
    schema,
  );

  // Node extensions first, then mark extensions, then the others.
  expect(builder.build()).toStrictEqual([
    ...nodePlugins,
    markPlugin,
    otherPlugin,
  ]);
  expect(nodeExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
  expect(markExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
  expect(otherExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
});

test("PluginsBuilder collects the plugins of a repeated extension once", () => {
  const plugin = new Plugin({});

  class DependencyExtension extends Extension {
    public override proseMirrorPlugins = vi.fn<() => Array<Plugin>>(() => [
      plugin,
    ]);
  }

  class FirstExtension extends Extension {
    public override dependencies(): Array<Extension> {
      return [new DependencyExtension()];
    }
  }

  class SecondExtension extends Extension {
    public override dependencies(): Array<Extension> {
      return [new DependencyExtension()];
    }
  }

  const builder = new PluginsBuilder(
    new ExtensionManager([new FirstExtension(), new SecondExtension()]),
    schema,
  );

  expect(builder.build()).toStrictEqual([plugin]);
});

test("PluginsBuilder works without any plugins", () => {
  const builder = new PluginsBuilder(
    new ExtensionManager([new OtherPluginExtension()]),
    schema,
  );

  expect(builder.build()).toStrictEqual([]);
});

test("PluginsBuilder collects the plugins once, on the first call", () => {
  const plugin = new Plugin({});
  const extension = new OtherPluginExtension();
  extension.proseMirrorPlugins.mockReturnValueOnce([plugin]);
  const builder = new PluginsBuilder(new ExtensionManager([extension]), schema);

  expect(extension.proseMirrorPlugins).not.toHaveBeenCalled();

  const plugins = builder.build();
  const pluginsAgain = builder.build();

  expect(pluginsAgain).toStrictEqual([plugin]);
  expect(pluginsAgain[0]).toBe(plugin);
  expect(extension.proseMirrorPlugins).toHaveBeenCalledExactlyOnceWith(schema);

  // A caller changing the returned array doesn't affect later calls.
  expect(pluginsAgain).not.toBe(plugins);

  plugins.pop();

  expect(builder.build()).toStrictEqual([plugin]);
});

test("PluginsBuilder calls the hooks again after one throws", () => {
  const plugin = new Plugin({});
  const extension = new OtherPluginExtension();
  extension.proseMirrorPlugins
    .mockImplementationOnce(() => {
      throw new Error("Failed");
    })
    .mockReturnValueOnce([plugin]);
  const builder = new PluginsBuilder(new ExtensionManager([extension]), schema);

  expect(() => builder.build()).toThrow("Failed");
  expect(builder.build()).toStrictEqual([plugin]);
  expect(extension.proseMirrorPlugins).toHaveBeenCalledTimes(2);
});
