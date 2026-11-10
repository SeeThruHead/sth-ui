import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFocusTrap" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Turn on focus trap" })).toBeVisible()
  }
}

export const Trapping: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Turn on focus trap" }))
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "First input" })).toHaveFocus())
    await userEvent.tab()
    await expect(canvas.getByRole("textbox", { name: "Second input" })).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole("textbox", { name: "First input" })).toHaveFocus()
  }
}
