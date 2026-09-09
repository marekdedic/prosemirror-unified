import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/prosemirror-unified/",
  description: "A framework for integrating ProseMirror with unified",
  lastUpdated: true,
  themeConfig: {
    editLink: {
      pattern:
        "https://github.com/marekdedic/prosemirror-unified/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },
    nav: [{ link: "/guide/introduction", text: "Guide" }],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        items: [
          { link: "/guide/introduction", text: "Introduction" },
          { link: "/guide/getting-started", text: "Getting started" },
        ],
        text: "Guide",
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/marekdedic/prosemirror-unified",
      },
    ],
  },
  title: "prosemirror-unified",
});
