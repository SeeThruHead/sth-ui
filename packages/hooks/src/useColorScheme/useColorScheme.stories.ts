import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useColorScheme" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const scheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    await waitFor(() => expect(within(canvasElement).getByText(`Your system color scheme is ${scheme}`)).toBeVisible())
  }
}
