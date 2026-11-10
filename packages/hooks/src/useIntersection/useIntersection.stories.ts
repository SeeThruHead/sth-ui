import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useIntersection" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Scroll down to the box")).toBeVisible()
  }
}

export const Scrolling: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Scroll down to the box")
    present(canvasElement.querySelector("[data-observed]")).scrollIntoView({ block: "center" })
    await expect(await canvas.findByText("Box is visible (100%)")).toBeInTheDocument()
    window.scrollTo({ top: 0 })
    await expect(await canvas.findByText("Scroll down to the box")).toBeVisible()
  }
}
