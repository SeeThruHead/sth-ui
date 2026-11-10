import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/ResourcesDayView" }

export default meta

const rowOf = (canvasElement: HTMLElement, resource: string) => {
  const row = canvasElement.querySelector(`[data-time-grid][data-resource-id="${resource}"]`)
  if (!(row instanceof HTMLElement)) throw new Error(`no row for ${resource}`)

  return row
}

const at = (row: HTMLElement, minutes: number) => {
  const box = row.getBoundingClientRect()

  return { clientX: box.left + (minutes / 600) * box.width + 1, clientY: box.top + box.height / 2 }
}

const pointer = (target: EventTarget, type: string, point: { readonly clientX: number; readonly clientY: number }) =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...point })
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 15, 2025")).toBeVisible()
    await expect(canvas.getAllByText("First floor")[0]).toBeVisible()
    await expect(canvas.getByText("Orion")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Kickoff" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "+1 more" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: "Offsite" })).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(4)
    await expect(canvas.getByText("Maintenance")).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("Date 2025-01-16")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await expect(await canvas.findByText("View week")).toBeVisible()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Workshop" }))
    await expect(await canvas.findByText("Opened Workshop")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Cleaning" }))
    await expect(await canvas.findByText("Opened Cleaning")).toBeVisible()
    await userEvent.click(
      canvas.getByRole("button", { name: "Resource time slot Studio 2025-01-15 15:00:00 - 15:30:00" })
    )
    await expect(await canvas.findByText("Slot 15:00 in 3")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "+1 more" }))
    await userEvent.click(canvas.getByRole("button", { name: "+1 more" }))
    const body = within(document.body)
    await userEvent.click(await body.findByRole("button", { name: "Review" }))
    await expect(await canvas.findByText("Opened Review")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    const first = canvas.getByRole("button", { name: "Resource time slot Orion 2025-01-15 08:00:00 - 08:30:00" })
    first.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Resource time slot Orion 2025-01-15 08:30:00 - 09:00:00" })
      ).toHaveFocus()
    )
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Resource time slot Lyra 2025-01-15 08:30:00 - 09:00:00" })
      ).toHaveFocus()
    )
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const podcast = await canvas.findByRole("button", { name: "Podcast" })
    const lyra = rowOf(canvasElement, "lyra")
    pointer(podcast, "pointerdown", {
      clientX: podcast.getBoundingClientRect().left + 5,
      clientY: podcast.getBoundingClientRect().top + 5
    })
    pointer(document, "pointermove", at(lyra, 305))
    await waitFor(() => expect(lyra.querySelector("[data-drag-preview]")).toHaveAttribute("data-invalid"))
    pointer(document, "pointermove", at(lyra, 425))
    await waitFor(() => expect(lyra.querySelector("[data-drag-preview]")).not.toHaveAttribute("data-invalid"))
    pointer(document, "pointerup", at(lyra, 425))
    await expect(await canvas.findByText("Moved to 15:00 in lyra")).toBeVisible()
    pointer(canvas.getByRole("button", { name: "Podcast" }), "pointerdown", at(lyra, 435))
    pointer(document, "pointermove", at(rowOf(canvasElement, "3"), 30))
    pointer(document, "pointerup", at(rowOf(canvasElement, "3"), 30))
    await expect(await canvas.findByText("Moved to 08:30 in 3")).toBeVisible()
    const studio = rowOf(canvasElement, "3")
    const firstSlot = studio.querySelector("[data-time-slot]")
    if (firstSlot === null) throw new Error("no slot")
    pointer(firstSlot, "pointerdown", at(studio, 5))
    pointer(document, "pointermove", at(studio, 300))
    await waitFor(() => expect(studio.querySelectorAll("[data-selected]").length).toBeGreaterThan(2))
    pointer(document, "pointerup", at(studio, 300))
    await expect(await canvas.findByText("Selected 08:00 to 13:30 in 3")).toBeVisible()
    const handle = canvasElement.querySelector('[data-event-id="workshop"] > [data-resize-edge="end"]')
    if (handle === null) throw new Error("no handle")
    pointer(handle, "pointerdown", at(lyra, 420))
    pointer(document, "pointermove", at(lyra, 480))
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-event-id="workshop"]')).toHaveAttribute("data-resizing")
    )
    pointer(document, "pointerup", at(lyra, 480))
    await expect(await canvas.findByText("Now 13:00 to 16:00")).toBeVisible()
    const transfer = new DataTransfer()
    transfer.setData("text/plain", "Call")
    const desk = rowOf(canvasElement, "desk")
    desk.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer, ...at(desk, 120) })
    )
    await expect(await canvas.findByText("Dropped at 10:00 in desk")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Rooms on 2025-01-15")).toBeVisible()
    await expect(canvas.getAllByText("FIRST FLOOR")[0]).toBeVisible()
    await expect(canvas.getAllByText("Room Orion")[0]).toBeVisible()
    await expect(canvas.getAllByText("9 AM")[0]).toBeVisible()
    await expect(canvas.getAllByText("• Review")[0]).toBeInTheDocument()
    await expect(canvas.getAllByRole("button", { name: "+1 more" })).toHaveLength(1)
    await expect(canvasElement.querySelector('[data-custom="kickoff"]')).not.toBeNull()
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(0)
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]').length).toBeGreaterThan(0)
  }
}
