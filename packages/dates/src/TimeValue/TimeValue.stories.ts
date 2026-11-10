import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/TimeValue" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("18:45")).toBeVisible()
    await expect(canvas.getByText("6:45 PM")).toBeVisible()
    await expect(canvas.getByText("18:45:34")).toBeVisible()
    await expect(canvas.getByText("6:05 a.m.")).toBeVisible()
    await expect(canvas.getByText(/Invalid: \[/)).toHaveTextContent("Invalid: []")
  }
}
