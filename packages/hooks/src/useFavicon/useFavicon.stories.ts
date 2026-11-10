import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useFavicon" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Pick a favicon")).toBeVisible()
  }
}

const link = () => document.querySelector("link[data-sth-favicon]")

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "SVG favicon" }))
    await waitFor(() => expect(link()).toHaveAttribute("type", "image/svg+xml"))
    await expect(document.querySelectorAll('link[rel*="icon"]')).toHaveLength(1)
    await userEvent.click(canvas.getByRole("button", { name: "PNG favicon" }))
    await waitFor(() => expect(link()).toHaveAttribute("href", "/logo.png"))
    await userEvent.click(canvas.getByRole("button", { name: "WebP favicon" }))
    await waitFor(() => expect(link()).not.toHaveAttribute("type"))
  }
}
