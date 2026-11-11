import type { StorybookConfig } from "@storybook/html-vite"

const config: StorybookConfig = {
  framework: "@storybook/html-vite",
  stories: ["../src/**/*.stories.ts"],
  staticDirs: ["../../core/.storybook/public"],
  addons: [],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  viteFinal: (vite) => ({
    ...vite,
    optimizeDeps: {
      ...vite.optimizeDeps,
      include: [
        ...(vite.optimizeDeps?.include ?? []),
        "effect",
        "effect/http",
        "foldkit",
        "foldkit/html",
        "foldkit/runtime",
        "foldkit/message",
        "foldkit/command",
        "foldkit/submodel",
        "@foldkit/ui/virtualList",
        "@foldkit/ui/anchor",
        "@foldkit/ui/animation",
        "foldkit/mount",
        "foldkit/schema",
        "foldkit/subscription",
        "foldkit/scene",
        "@stylexjs/stylex",
        "storybook/test",
        "@foldkit/ui/checkbox",
        "@foldkit/ui/combobox",
        "@foldkit/ui/hoverIntent",
        "@foldkit/ui/menu",
        "@foldkit/ui/popover",
        "@foldkit/ui/radioGroup",
        "@foldkit/ui/slider",
        "@foldkit/ui/switch",
        "@foldkit/ui/tooltip",
        "effect/Function",
        "foldkit/dom",
        "foldkit/file"
      ]
    }
  })
}

export default config
