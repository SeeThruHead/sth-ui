import type { StorybookConfig } from "@storybook/html-vite"
import base from "../.storybook/main.ts"

const config: StorybookConfig = {
  ...base,
  stories: [
    "../src/**/*.stories.ts",
    "../../charts/src/**/*.stories.ts",
    "../../hooks/src/**/*.stories.ts",
    "../../dates/src/**/*.stories.ts",
    "../../code-highlight/src/**/*.stories.ts",
    "../../form/src/**/*.stories.ts",
    "../../schedule/src/**/*.stories.ts",
    "../../data-table/src/**/*.stories.ts",
    "../../tiptap/src/**/*.stories.ts"
  ],
  staticDirs: ["../.storybook/public"]
}

export default config
