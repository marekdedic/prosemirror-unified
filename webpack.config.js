function createConfig(libraryType, extension) {
  return {
    devtool: "source-map",
    entry: {
      "prosemirror-unified": "./src/index.ts",
    },
    experiments: {
      outputModule: true,
    },
    externals: {
      "prosemirror-commands": "module prosemirror-commands",
      "prosemirror-inputrules": "module prosemirror-inputrules",
      "prosemirror-keymap": "module prosemirror-keymap",
      "prosemirror-model": "module prosemirror-model",
      "prosemirror-state": "module prosemirror-state",
      unified: "module unified",
    },
    mode: "production",
    module: {
      rules: [
        {
          test: /\.ts$/u,
          use: {
            loader: "ts-loader",
            options: {
              onlyCompileBundledFiles: true,
            },
          },
        },
      ],
    },
    optimization: {
      minimize: false,
    },
    output: {
      filename: `[name].${extension}`,
      library: {
        type: libraryType,
      },
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
  };
}

export default [createConfig("module", "js"), createConfig("commonjs2", "cjs")];
