import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFocusReturn" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Open panel" })).toBeVisible()
  }
}

export const Returning: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const open = await canvas.findByRole("button", { name: "Open panel" })
    await userEvent.click(open)
    await userEvent.click(await canvas.findByRole("button", { name: "Open panel" }))
    await userEvent.click(await canvas.findByRole("button", { name: "Close panel" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Open panel" })).toHaveFocus())
  }
}
