import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useRadialMove" }

export default meta

const at = (type: string, clientX: number, clientY: number) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Value: 115°, last released at 115°")).toBeVisible()
  }
}

export const Turning: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Value: 115°/)
    const dial = present(canvasElement.querySelector<HTMLElement>("[data-dial]"))
    const box = dial.getBoundingClientRect()
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    dial.dispatchEvent(at("mousedown", cx + 50, cy))
    await expect(await canvas.findByText("Value: 90°, last released at 115°")).toBeVisible()
    document.dispatchEvent(at("mousemove", cx, cy + 50))
    await expect(await canvas.findByText("Value: 180°, last released at 115°")).toBeVisible()
    document.dispatchEvent(at("mouseup", cx - 50, cy))
    await expect(await canvas.findByText("Value: 270°, last released at 270°")).toBeVisible()
  }
}
