import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useTextSelection" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Select some of this text to see it below.")).toBeVisible()
  }
}

export const Selecting: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const text = await canvas.findByText("Select some of this text to see it below.")
    const range = document.createRange()
    range.selectNodeContents(text)
    document.getSelection()?.removeAllRanges()
    document.getSelection()?.addRange(range)
    await expect(await canvas.findByText("Selected text: Select some of this text to see it below.")).toBeVisible()
  }
}
