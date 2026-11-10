import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/ResourcesWeekView" }

export default meta

const segmentOf = (canvasElement: HTMLElement, resource: string, date: string) => {
  const segment = canvasElement.querySelector(`[data-time-grid][data-resource-id="${resource}"][data-date="${date}"]`)
  if (!(segment instanceof HTMLElement)) throw new Error(`no segment ${resource} ${date}`)

  return segment
}

const at = (segment: HTMLElement, minutes: number) => {
  const box = segment.getBoundingClientRect()

  return { clientX: box.left + (minutes / 600) * box.width + 1, clientY: box.top + box.height - 6 }
}

const pointer = (target: EventTarget, type: string, point: { readonly clientX: number; readonly clientY: number }) =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...point })
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Jan 13 – Jan 17, 2025")).toBeVisible()
    await expect(canvas.getByText("Wed 15 •")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Retreat" })).toBeInTheDocument()
    await expect(canvas.getAllByRole("button", { name: "Standup" })).toHaveLength(5)
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(4)
    await userEvent.click(canvas.getByRole("button", { name: "Pitch" }))
    await expect(await canvas.findByText("Opened Pitch")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("Week of 2025-01-22")).toBeVisible()
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const recording = await canvas.findByRole("button", { name: "Recording" })
    const target = segmentOf(canvasElement, "lyra", "2025-01-17")
    pointer(recording, "pointerdown", {
      clientX: recording.getBoundingClientRect().left + 3,
      clientY: recording.getBoundingClientRect().top + 3
    })
    pointer(document, "pointermove", { clientX: 10, clientY: 5000 })
    pointer(document, "pointermove", at(target, 125))
    await waitFor(() => expect(target.querySelector("[data-drag-preview]")).not.toBeNull())
    pointer(document, "pointerup", at(target, 125))
    await expect(await canvas.findByText("Moved to 2025-01-17 10:00:00 in lyra")).toBeVisible()
    const wednesday = segmentOf(canvasElement, "desk", "2025-01-15")
    const slot = wednesday.querySelector("[data-time-slot]")
    if (slot === null) throw new Error("no slot")
    pointer(slot, "pointerdown", at(wednesday, 5))
    pointer(document, "pointermove", at(wednesday, 300))
    await waitFor(() => expect(wednesday.querySelectorAll("[data-selected]").length).toBeGreaterThan(1))
    pointer(document, "pointerup", at(wednesday, 300))
    await expect(await canvas.findByText("SlotsSelected")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to day view" }))
    await expect(await canvas.findByText("View day")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("2025-01-12 to 2025-01-18")).toBeVisible()
    await expect(canvas.getAllByText("Su 12")[0]).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]').length).toBeGreaterThan(0)
    await expect(canvas.getAllByRole("button", { name: "Standup" })).toHaveLength(2)
  }
}
