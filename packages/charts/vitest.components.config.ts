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
      name: "charts-components",
      reporters: ["default", coverageWarnings("charts-components", "coverage/components")],
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
          "src/shared/geometry.ts",
          "src/pie/pie.ts",
          "src/grid/grid.ts",
          "src/RadarChart/radar.ts",
          "src/FunnelChart/funnel.ts",
          "src/RadialBarChart/radial.ts",
          "src/BubbleChart/bubble.ts",
          "src/GaugeChart/gauge.ts",
          "src/Heatmap/calendar.ts",
          "src/WaffleChart/waffle.ts",
          "src/MatrixChart/matrix.ts",
          "src/Treemap/squarify.ts",
          "src/SunburstChart/sunburst.ts",
          "src/CandlestickChart/candles.ts",
          "src/SankeyChart/sankey.ts"
        ],
        reporter: ["text-summary", "text", "json", "json-summary"],
        reportsDirectory: "coverage/components"
      }
    }
  })
)
