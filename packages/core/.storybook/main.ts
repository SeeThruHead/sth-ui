import type { StorybookConfig } from "@storybook/html-vite"

const config: StorybookConfig = {
  framework: "@storybook/html-vite",
  stories: ["../src/**/*.stories.ts"],
  staticDirs: ["./public"],
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
        "foldkit",
        "foldkit/html",
        "foldkit/runtime",
        "foldkit/message",
        "foldkit/command",
        "foldkit/submodel",
        "@foldkit/ui/checkbox",
        "@foldkit/ui/combobox",
        "@foldkit/ui/hoverIntent",
        "@foldkit/ui/menu",
        "@foldkit/ui/popover",
        "@foldkit/ui/radioGroup",
        "@foldkit/ui/slider",
        "@foldkit/ui/switch",
        "@foldkit/ui/tooltip",
        "@foldkit/ui/virtualList",
        "@foldkit/ui/anchor",
        "@foldkit/ui/animation",
        "foldkit/mount",
        "foldkit/schema",
        "foldkit/subscription",
        "@stylexjs/stylex",
        "storybook/test"
      ]
    }
  })
}

export default config
