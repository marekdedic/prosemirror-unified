/* eslint-env node */

const TerserPlugin = require("terser-webpack-plugin");

module.exports = () => {
  return {
    mode: "production",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
            options: {
              onlyCompileBundledFiles: true,
            },
          },
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    entry: {
      "prosemirror-unified": "./src/index.ts",
    },
    output: {
      filename: "[name].min.js",
      library: {
        type: "module",
      },
    },
    externals: {
      // TODO: Either put peer-dependencies here or make them regular dependencies
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
    experiments: {
      outputModule: true,
    },
  };
};
