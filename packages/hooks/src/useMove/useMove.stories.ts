import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useMove" }

export default meta

const at = (type: string, clientX: number, clientY: number) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Values: x 20, y 60")).toBeVisible()
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Values: x 20, y 60")
    const area = present(canvasElement.querySelector<HTMLElement>("[data-move-area]"))
    const box = area.getBoundingClientRect()
    area.dispatchEvent(at("mousedown", box.left + box.width / 2, box.top + box.height / 4))
    await expect(await canvas.findByText("Values: x 50, y 25")).toBeVisible()
    document.dispatchEvent(at("mousemove", box.right + 50, box.bottom + 50))
    await expect(await canvas.findByText("Values: x 100, y 100")).toBeVisible()
    document.dispatchEvent(at("mouseup", box.right, box.bottom))
    document.dispatchEvent(at("mousemove", box.left, box.top))
    await expect(canvas.getByText("Values: x 100, y 100")).toBeVisible()
  }
}
