import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useStateHistory" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Current value: 1")).toBeVisible()
    await expect(canvas.getByText("History: 1")).toBeVisible()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Set value" }))
    await userEvent.click(canvas.getByRole("button", { name: "Set value" }))
    await expect(await canvas.findByText("History: 1, 2, 3")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Back" }))
    await expect(await canvas.findByText("Current value: 2")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Forward" }))
    await expect(await canvas.findByText("Current value: 3")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }))
    await expect(await canvas.findByText("History: 1")).toBeVisible()
  }
}
