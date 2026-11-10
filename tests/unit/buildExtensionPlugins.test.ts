import { Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { expect, test, vi } from "vitest";

import { buildExtensionPlugins } from "../../src/buildExtensionPlugins";
import { Extension } from "../../src/Extension";
import { ExtensionManager } from "../../src/ExtensionManager";
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

test("buildExtensionPlugins collects the plugins of all extensions", () => {
  const nodePlugins = [new Plugin({}), new Plugin({})];
  const markPlugin = new Plugin({});
  const otherPlugin = new Plugin({});

  const nodeExtension = new NodePluginExtension();
  nodeExtension.proseMirrorPlugins.mockReturnValueOnce(nodePlugins);
  const markExtension = new MarkPluginExtension();
  markExtension.proseMirrorPlugins.mockReturnValueOnce([markPlugin]);
  const otherExtension = new OtherPluginExtension();
  otherExtension.proseMirrorPlugins.mockReturnValueOnce([otherPlugin]);

  const plugins = buildExtensionPlugins(
    new ExtensionManager([otherExtension, markExtension, nodeExtension]),
    schema,
  );

  // Node extensions first, then mark extensions, then the others.
  expect(plugins).toStrictEqual([...nodePlugins, markPlugin, otherPlugin]);
  expect(nodeExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
  expect(markExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
  expect(otherExtension.proseMirrorPlugins).toHaveBeenCalledWith(schema);
});

test("buildExtensionPlugins collects the plugins of a repeated extension once", () => {
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

  const plugins = buildExtensionPlugins(
    new ExtensionManager([new FirstExtension(), new SecondExtension()]),
    schema,
  );

  expect(plugins).toStrictEqual([plugin]);
});

test("buildExtensionPlugins works without any plugins", () => {
  const plugins = buildExtensionPlugins(
    new ExtensionManager([new OtherPluginExtension()]),
    schema,
  );

  expect(plugins).toStrictEqual([]);
});
