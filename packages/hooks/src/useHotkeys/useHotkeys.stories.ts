import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useHotkeys" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Press Ctrl + K or Mod + J to switch: light")).toBeVisible()
  }
}

export const Pressing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/switch: light/)
    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(await canvas.findByText(/switch: dark/)).toBeVisible()
    const input = canvas.getByRole("textbox", { name: "Note" })
    await userEvent.click(input)
    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(canvas.getByText(/switch: dark/)).toBeVisible()
    await userEvent.keyboard("{Control>}s{/Control}")
    await expect(await canvas.findByText("Saved 1 times")).toBeVisible()
  }
}
