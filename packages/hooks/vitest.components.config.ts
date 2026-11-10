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
      name: "hooks-components",
      reporters: ["default", coverageWarnings("hooks-components", "coverage/components")],
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
          "src/useOs/os.ts",
          "src/useValidatedState/validated.ts",
          "src/useQueue/queue.ts",
          "src/useStateHistory/history.ts",
          "src/useListState/list.ts",
          "src/useSelection/selection.ts",
          "src/useMediaQuery/mediaQuery.ts",
          "src/useColorScheme/colorScheme.ts",
          "src/useOrientation/orientation.ts",
          "src/useIdle/idle.ts",
          "src/useWindowEvent/windowEvent.ts",
          "src/shared/watch.ts",
          "src/useDocumentTitle/title.ts",
          "src/useFavicon/favicon.ts",
          "src/useHash/hash.ts",
          "src/useNetwork/network.ts",
          "src/useWindowScroll/scroll.ts",
          "src/useClipboard/clipboard.ts",
          "src/useLongPress/longPress.ts",
          "src/usePagination/pagination.ts",
          "src/useHeadroom/headroom.ts",
          "src/useLocalStorage/storage.ts",
          "src/useMove/scrub.ts",
          "src/useDrag/drag.ts",
          "src/useRovingIndex/roving.ts",
          "src/useScrollIntoView/scrollMath.ts",
          "src/useCollapse/collapse.ts"
        ],
        reporter: ["text-summary", "text", "json", "json-summary"],
        reportsDirectory: "coverage/components"
      }
    }
  })
)
