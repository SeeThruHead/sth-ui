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
      name: "dates-components",
      reporters: ["default", coverageWarnings("dates-components", "coverage/components")],
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
        include: ["src/**"],
        exclude: [
          "**/*.stories.ts",
          "**/demos/**",
          "**/*.test.ts",
          "**/*.stylex.ts",
          "src/date/date.ts",
          "src/Calendar/keys.ts",
          "src/Calendar/model.ts",
          "src/Calendar/levels.ts",
          "src/picker/selection.ts",
          "src/picker/model.ts",
          "src/picker/inputModel.ts",
          "src/picker/format.ts",
          "src/date/parse.ts",
          "src/DateInput/model.ts",
          "src/time/time.ts",
          "src/time/clock.ts",
          "src/time/spin.ts",
          "src/TimePicker/model.ts",
          "src/time/datetime.ts",
          "src/InlineDateTimePicker/model.ts",
          "src/DateTimePicker/model.ts",
          "src/time/grid.ts"
        ],
        reporter: ["text-summary", "text", "json", "json-summary"],
        reportsDirectory: "coverage/components"
      }
    }
  })
)
