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
      name: "schedule-components",
      reporters: ["default", coverageWarnings("schedule-components", "coverage/components")],
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
          "src/datetime.ts",
          "src/recurrence.ts",
          "src/events.ts",
          "src/dayLayout.ts",
          "src/labels.ts",
          "src/format.ts",
          "src/businessHours.ts",
          "src/placement.ts",
          "src/DayView/interaction.ts",
          "src/DayView/model.ts",
          "src/ScheduleHeader/keys.ts",
          "src/AgendaView/agenda.ts",
          "src/weekLayout.ts",
          "src/TimeGrid/keys.ts",
          "src/monthLayout.ts",
          "src/Schedule/model.ts",
          "src/resourcesLayout.ts",
          "src/defined.ts"
        ],
        reporter: ["text-summary", "text", "json", "json-summary"],
        reportsDirectory: "coverage/components"
      }
    }
  })
)
