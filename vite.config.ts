/// <reference types="vitest/config" />

import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index",
      formats: ["es", "cjs"],
      name: "prosemirror-unified",
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
    sourcemap: true,
  },
  plugins: [dts({ bundleTypes: true })],
  test: {
    environment: "jsdom",
    mockReset: true,
    setupFiles: ["tests/setup.ts"],
  },
});
