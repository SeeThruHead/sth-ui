import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useLongPress" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Events: none")).toBeVisible()
  }
}

export const Pressing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Press and hold" })
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    await waitFor(() => expect(canvas.getByText("Events: started, longPressed")).toBeVisible(), { timeout: 2000 })
    button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }))
    await expect(await canvas.findByText(/longPressed, finished$/)).toBeVisible()
    await userEvent.click(button)
    await expect(await canvas.findByText(/finished, started, cancelled$/)).toBeVisible()
  }
}
