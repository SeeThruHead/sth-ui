import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useWindowEvent" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Press any key")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Clicked 0 times" })).toBeVisible()
  }
}

export const Pressing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Press any key")
    await userEvent.keyboard("q")
    await expect(await canvas.findByText("Last key: q")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Clicked 0 times" }))
    await expect(await canvas.findByRole("button", { name: "Clicked 1 times" })).toBeVisible()
  }
}
