import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/usePageLeave" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Mouse left the page 0 times")).toBeVisible()
  }
}

export const Leaving: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Mouse left the page 0 times")
    await waitFor(() => {
      document.documentElement.dispatchEvent(new MouseEvent("mouseleave"))

      return expect(canvas.queryByText("Mouse left the page 0 times")).toBeNull()
    })
  }
}
