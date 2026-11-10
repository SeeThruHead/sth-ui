import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useValidatedState" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Your email" })).toHaveValue("bob@example.com")
    await expect(canvas.getByText("Last valid value: bob@example.com")).toBeVisible()
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Your email" })
    await userEvent.clear(input)
    await expect(await canvas.findByText("Current value: [empty string]")).toBeVisible()
    await expect(canvas.getByText("Enter a valid email")).toBeVisible()
    await userEvent.type(input, "ann@example.com")
    await expect(await canvas.findByText("Last valid value: ann@example.com")).toBeVisible()
    await expect(canvas.queryByText("Enter a valid email")).toBeNull()
  }
}
