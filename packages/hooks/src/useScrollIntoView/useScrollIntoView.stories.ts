import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useScrollIntoView" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Status: idle")).toBeVisible()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Scroll to start" }))
    const parent = present(canvasElement.querySelector("#scroll-parent"))
    await expect(await canvas.findByText("Status: finished", {}, { timeout: 3000 })).toBeVisible()
    await expect(Math.round(parent.scrollTop)).toBe(600)
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to end" }))
    await waitFor(() => expect(canvas.getByText("Status: scrolling")).toBeVisible())
    window.dispatchEvent(new WheelEvent("wheel"))
    await expect(await canvas.findByText("Status: cancelled")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to center" }))
    await expect(await canvas.findByText("Status: finished", {}, { timeout: 3000 })).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Scroll the page" })).toBeVisible()
  }
}

export const ScrollingOptions: StoryObj = {
  render: demoApp(OptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Scroll sideways" }))
    await expect(await canvas.findByText("Status: finished", {}, { timeout: 3000 })).toBeInTheDocument()
    await expect(present(canvasElement.querySelector("#side-parent")).scrollLeft).toBeGreaterThan(400)
    await userEvent.click(canvas.getByRole("button", { name: "Scroll to nothing" }))
    await expect(await canvas.findByText("Status: cancelled")).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Scroll the page" }))
    await expect(await canvas.findByText("Status: finished")).toBeInTheDocument()
    await expect(window.scrollY).toBeGreaterThan(0)
    window.scrollTo({ top: 0 })
  }
}
