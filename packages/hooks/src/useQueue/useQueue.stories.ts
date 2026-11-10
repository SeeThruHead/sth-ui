import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useQueue" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("1, 2")).toBeVisible()
    await expect(canvas.getByText("3")).toBeVisible()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Add item" }))
    await expect(await canvas.findByText("3, 4")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Remove multiples of 3" }))
    await expect(await canvas.findByText("4")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Clean queue" }))
    await expect(await canvas.findByText("Empty")).toBeVisible()
    await expect(canvas.getByText("1, 2")).toBeVisible()
  }
}
