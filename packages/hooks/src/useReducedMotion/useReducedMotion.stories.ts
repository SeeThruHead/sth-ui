import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useReducedMotion" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const text = reduced ? "You prefer reduced motion" : "You do not prefer reduced motion"
    await waitFor(() => expect(within(canvasElement).getByText(text)).toBeVisible())
  }
}
