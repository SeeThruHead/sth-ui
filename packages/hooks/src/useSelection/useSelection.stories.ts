import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useSelection" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("checkbox", { name: "Nitrogen" })).toBeChecked()
    await expect(canvas.getByRole("checkbox", { name: "Select all" })).toBePartiallyChecked()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Select all" }))
    await expect(await canvas.findByText("Selected: Carbon, Nitrogen, Yttrium, Barium, Cerium")).toBeVisible()
    await expect(canvas.getByRole("checkbox", { name: "Select all" })).toBeChecked()
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select all" }))
    await expect(await canvas.findByText("Selected: none")).toBeVisible()
    await userEvent.click(canvas.getByRole("checkbox", { name: "Barium" }))
    await expect(await canvas.findByText("Selected: Barium")).toBeVisible()
  }
}
