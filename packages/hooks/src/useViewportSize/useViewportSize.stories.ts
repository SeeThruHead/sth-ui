import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useViewportSize" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(`Width: ${window.innerWidth}, height: ${window.innerHeight}`)).toBeVisible()
    window.dispatchEvent(new Event("resize"))
    await expect(canvas.getByText(`Width: ${window.innerWidth}, height: ${window.innerHeight}`)).toBeVisible()
  }
}
