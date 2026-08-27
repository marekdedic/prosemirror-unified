/// <reference types="vitest/config" />

import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index",
      formats: ["es", "cjs"],
    },
    minify: false,
    rollupOptions: {
      external: [
        "prosemirror-commands",
        "prosemirror-inputrules",
        "prosemirror-keymap",
        "prosemirror-model",
        "prosemirror-state",
        "unified",
      ],
    },
  },
  plugins: [dts({ bundleTypes: true })],
  test: {
    coverage: {
      exclude: ["tests/**"],
    },
    environment: "jsdom",
    mockReset: true,
  },
});
