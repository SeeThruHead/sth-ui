import stylex from "@stylexjs/unplugin/vite"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"
import { withCi } from "@sth-ui/testing/Ci.ts"
import { coverageWarnings } from "@sth-ui/testing/CoverageBar.ts"

const browserBinary =
  process.env["CHROME_PATH"] === undefined ? { channel: "chrome" } : { executablePath: process.env["CHROME_PATH"] }

export default withCi(
  defineConfig({
    plugins: [stylex({ devMode: "full" }), storybookTest({ configDir: ".storybook" })],
    test: {
      name: "core-components",
      reporters: ["default", coverageWarnings("core-components", "coverage/components")],
      testTimeout: 20_000,
      passWithNoTests: true,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({
          launchOptions: { ...browserBinary, chromiumSandbox: true },
          contextOptions: { permissions: ["clipboard-read", "clipboard-write"] }
        }),
        instances: [{ browser: "chromium" as const }],
        connectTimeout: 60_000
      },
      coverage: {
        enabled: true,
        provider: "istanbul",
        include: ["src/components/**", "src/styles/**", "src/theme/**", "src/hooks/drag.ts", "src/Ui.ts"],
        exclude: [
          "**/*.stories.ts",
          "**/demos/**",
          "**/*.test.ts",
          "**/*.stylex.ts",
          "**/model.ts",
          "src/components/Notifications/queue.ts",
          "src/hooks/hotkey.ts",
          "src/components/Spotlight/filter.ts",
          "src/components/Dropzone/validate.ts",
          "src/components/Dropzone/mimeTypes.ts",
          "src/components/Carousel/engine.ts",
          "src/components/Lightbox/zoom.ts",
          "**/initials.ts",
          "**/Tabs/keyboard.ts",
          "**/Toolbar/navigation.ts",
          "**/ColorPicker/color.ts",
          "**/Highlight/highlighter.ts",
          "**/NumberFormatter/format.ts",
          "**/Input/numberRules.ts",
          "src/styles/stylexClass.ts"
        ],
        reporter: ["text-summary", "text", "json", "json-summary"],
        reportsDirectory: "coverage/components"
      }
    }
  })
)
