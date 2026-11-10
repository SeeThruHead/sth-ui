import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo } from "../../stories/harness.ts"
import { present } from "../../stories/dom.ts"

import * as UsageDemo from "./demos/usage.ts"
import * as InlineDemo from "./demos/inline.ts"
const meta: Meta = { title: "Layout/Center" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const text = await within(canvasElement).findByText("All elements inside Center are centered")
    const box = present(text.parentElement).getBoundingClientRect()
    const inner = text.getBoundingClientRect()
    await expect(inner.left - box.left).toBeCloseTo(box.right - inner.right, 0)
    await expect(inner.top - box.top).toBeCloseTo(box.bottom - inner.bottom, 0)
  }
}

export const Inline: StoryObj = {
  render: demo(InlineDemo.view),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "← Back to Mantine website" })
    const center = present(link.firstElementChild)
    await expect(getComputedStyle(center).display).toBe("inline-flex")
    await expect(center.tagName).toBe("SPAN")
  }
}
