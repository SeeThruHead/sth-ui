import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useIdle" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Current state: idle")).toBeVisible()
  }
}

export const Moving: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Current state: idle")
    await waitFor(() => {
      document.dispatchEvent(new MouseEvent("mousemove"))

      return expect(canvas.getByText("Current state: not idle")).toBeVisible()
    })
    await waitFor(() => expect(canvas.getByText("Current state: idle")).toBeVisible(), { timeout: 4000 })
    await userEvent.keyboard("a")
    await expect(await canvas.findByText("Current state: not idle")).toBeVisible()
  }
}
