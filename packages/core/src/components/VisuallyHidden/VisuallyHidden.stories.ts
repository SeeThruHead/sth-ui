import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Miscellaneous/VisuallyHidden" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Like post" })
    const hidden = within(button).getByText("Like post")
    await expect(hidden.getBoundingClientRect().width).toBe(1)
    await expect(getComputedStyle(hidden).position).toBe("absolute")
    await expect(getComputedStyle(hidden).overflow).toBe("hidden")
  }
}
