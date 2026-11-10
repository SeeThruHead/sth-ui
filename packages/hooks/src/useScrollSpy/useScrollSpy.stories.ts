import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useScrollSpy" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Introduction", { selector: "p" })).toBeVisible()
    await expect(canvas.getByText("Examples", { selector: "p" })).toBeVisible()
  }
}

export const Spying: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Usage", { selector: "p" })
    present(canvas.getByText("Usage", { selector: "h3" })).scrollIntoView()
    window.dispatchEvent(new Event("scroll"))
    await waitFor(() => expect(getComputedStyle(canvas.getByText("Usage", { selector: "p" })).fontWeight).toBe("700"))
    window.scrollTo({ top: 0 })
  }
}
