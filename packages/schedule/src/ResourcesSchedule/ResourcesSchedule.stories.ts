import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/ResourcesSchedule" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 15, 2025")).toBeVisible()
    await expect(canvas.queryByRole("tab", { name: "Switch to year view" })).toBeNull()
    await expect(canvas.getByRole("button", { name: "Pitch" })).toBeInTheDocument()
    const pitch = canvas.getByRole("button", { name: "Pitch" })
    const box = pitch.getBoundingClientRect()
    const point = (dx: number) => ({
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      isPrimary: true,
      clientX: box.left + 4 + dx,
      clientY: box.top + 4
    })
    pitch.dispatchEvent(new PointerEvent("pointerdown", point(0)))
    document.dispatchEvent(new PointerEvent("pointermove", point(130)))
    document.dispatchEvent(new PointerEvent("pointerup", point(130)))
    await expect(await canvas.findByText("EventDropped")).toBeVisible()
  }
}

export const SwitchingViews: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: "Resource time slot Orion 2025-01-15 14:00:00 - 15:00:00" })
    )
    await expect(await canvas.findByText("Slot 2025-01-15 14:00:00")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await expect(await canvas.findByText("Jan 13 – Jan 19, 2025")).toBeVisible()
    await expect(canvas.getByText("ViewChanged")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("Jan 20 – Jan 26, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to month view" }))
    await expect(await canvas.findByText("January 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Orion January 28, 2025" }))
    await expect(await canvas.findByText("Day 2025-01-28")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Recording" }))
    await expect(await canvas.findByText("Opened Recording")).toBeVisible()
  }
}
