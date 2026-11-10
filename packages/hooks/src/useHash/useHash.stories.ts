import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useHash" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Go to about" })).toBeVisible()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Go to about" }))
    await expect(await canvas.findByText("Current hash: #about")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Go to #pricing" }))
    await expect(await canvas.findByText("Current hash: #pricing")).toBeVisible()
  }
}
