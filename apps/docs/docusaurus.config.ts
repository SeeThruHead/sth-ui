import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
  title: "sth-ui",
  tagline: "Mantine's components on Foldkit and Effect, styled with StyleX",
  url: "http://127.0.0.1:3220",
  baseUrl: "/",
  onBrokenLinks: "throw",
  markdown: { hooks: { onBrokenMarkdownLinks: "throw" } },
  clientModules: ["./src/fonts.ts"],
  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/",
        searchBarShortcutHint: true,
        highlightSearchTermsOnTargetPage: false
      }
    ]
  ],
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/SeeThruHead/sth-ui/edit/main/apps/docs/"
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    colorMode: { defaultMode: "light", respectPrefersColorScheme: false },
    navbar: {
      title: "sth-ui",
      logo: { alt: "", src: "img/logo.svg" },
      items: [
        { href: "pathname:///storybook/index.html", label: "Storybook", position: "left" },
        { type: "search", position: "right" }
      ]
    },
    docs: { sidebar: { hideable: false, autoCollapseCategories: false } },
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.vsDark }
  } satisfies Preset.ThemeConfig
}

export default config
