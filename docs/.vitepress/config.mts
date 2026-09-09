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
    nav: [
      { link: "/guide/introduction", text: "Guide" },
      { link: "/developing/overview", text: "Developing extensions" },
    ],
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
      {
        items: [
          { link: "/developing/overview", text: "Overview" },
          { link: "/developing/extensions", text: "Extension API" },
        ],
        text: "Developing extensions",
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
