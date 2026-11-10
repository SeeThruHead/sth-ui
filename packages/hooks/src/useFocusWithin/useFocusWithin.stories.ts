import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFocusWithin" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No input is focused")).toBeVisible()
  }
}

export const Focusing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("textbox", { name: "First input" }))
    await expect(await canvas.findByText("One of the inputs is focused")).toBeVisible()
    await userEvent.tab()
    await expect(canvas.getByRole("textbox", { name: "Second input" })).toHaveFocus()
    await expect(canvas.getByText("One of the inputs is focused")).toBeVisible()
    await userEvent.click(document.body)
    await expect(await canvas.findByText("No input is focused")).toBeVisible()
  }
}
