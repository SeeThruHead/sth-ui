import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useMouse" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Inside the box: x 0, y 0")).toBeVisible()
  }
}

export const Moving: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Inside the box: x 0, y 0")
    const box = present(canvasElement.querySelector<HTMLElement>("[data-mouse-target]"))
    const rect = box.getBoundingClientRect()
    await userEvent.pointer({ target: box, coords: { clientX: rect.left + 30, clientY: rect.top + 20 } })
    await expect(await canvas.findByText("Inside the box: x 30, y 20")).toBeVisible()
    await expect(
      canvas.getByText(`On the page: x ${Math.round(rect.left + 30)}, y ${Math.round(rect.top + 20)}`)
    ).toBeVisible()
    await userEvent.unhover(box)
    await expect(await canvas.findByText("Inside the box: x 0, y 0")).toBeVisible()
  }
}
