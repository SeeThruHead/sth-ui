import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useDrag" }

export default meta

const at = (type: string, clientX: number, clientY: number) =>
  new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, clientX, clientY })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Offset: 0, 0; taps: 0")).toBeVisible()
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Offset: 0, 0; taps: 0")
    const card = present(canvasElement.querySelector<HTMLElement>("[data-draggable-card]"))
    card.dispatchEvent(at("pointerdown", 100, 100))
    document.dispatchEvent(at("pointermove", 102, 101))
    document.dispatchEvent(at("pointerup", 102, 101))
    await expect(await canvas.findByText("Offset: 0, 0; taps: 1")).toBeVisible()
    card.dispatchEvent(at("pointerdown", 100, 100))
    document.dispatchEvent(at("pointermove", 140, 120))
    await expect(await canvas.findByText("Offset: 40, 20; taps: 1")).toBeVisible()
    await expect(document.body.style.getPropertyValue("user-select")).toBe("none")
    document.dispatchEvent(at("pointerup", 150, 130))
    await expect(await canvas.findByText("Offset: 50, 30; taps: 1")).toBeVisible()
    await expect(document.body.style.getPropertyValue("user-select")).toBe("")
  }
}
