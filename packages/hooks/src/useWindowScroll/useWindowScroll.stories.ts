import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useWindowScroll" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Scroll position x: 0, y: 0")).toBeVisible()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Scroll down" }))
    await expect(await canvas.findByText("Scroll position x: 0, y: 200", {}, { timeout: 3000 })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to top" }))
    await expect(await canvas.findByText("Scroll position x: 0, y: 0", {}, { timeout: 3000 })).toBeVisible()
  }
}
