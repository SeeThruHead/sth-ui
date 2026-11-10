import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useMediaQuery" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const matches = window.matchMedia(UsageDemo.query).matches
    const text = `Breakpoint ${UsageDemo.query} ${matches ? "matches" : "does not match"}`
    await waitFor(() => expect(within(canvasElement).getByText(text)).toBeVisible())
  }
}
