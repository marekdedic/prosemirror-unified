import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
  plugins: [dts({ rollupTypes: true })],
  test: {
    environment: "jsdom",
    mockReset: true,
    setupFiles: ["tests/setup.ts"],
  },
});
