import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as DraggingDemo from "./demos/dragging.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/DayView" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 15, 2025")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Design review" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Standup" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "+2 more" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Lunch" })).toBeInTheDocument()
    await waitFor(() =>
      expect(Array.from(canvasElement.querySelectorAll("div")).some((element) => element.scrollTop > 0)).toBe(true)
    )
    await expect(canvas.getByText("10:30")).toBeVisible()
    await expect(canvas.getByRole("tab", { name: "Switch to day view" })).toHaveAttribute("aria-selected", "true")
    const idle = new DragEvent("dragover", { bubbles: true, cancelable: true })
    gridOf(canvasElement).dispatchEvent(idle)
    gridOf(canvasElement).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true }))
    await expect(idle.defaultPrevented).toBe(false)
  }
}

export const Navigating: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("January 16, 2025")).toBeVisible()
    await expect(canvas.queryByRole("button", { name: "Design review" })).toBeNull()
    await expect(canvas.getByRole("button", { name: "Standup" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await expect(await canvas.findByText("January 15, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await expect(await canvas.findByText("January 14, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Today" }))
    await expect(await canvas.findByText("January 15, 2025")).toBeVisible()
    canvas.getByRole("tab", { name: "Switch to day view" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(canvas.getByRole("tab", { name: "Switch to week view" })).toHaveFocus())
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(canvas.getByRole("tab", { name: "Switch to year view" })).toHaveFocus())
    await userEvent.keyboard("{Enter}")
    await expect(await canvas.findByText("Switch to the year view")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await expect(await canvas.findByText("Switch to the week view")).toBeVisible()
    canvas.getByRole("button", { name: "Design review" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(canvas.getByRole("button", { name: "Design review" })).toHaveFocus()
    await userEvent.click(canvas.getByRole("button", { name: "Design review" }))
    await expect(await canvas.findByText("Opened Design review")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await expect(await canvas.findByText("January 15, 2025 – January 15, 2025")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Agenda" })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(canvas.getByRole("button", { name: /Retrospective/ }))
    await expect(await canvas.findByText("Opened Retrospective")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await canvas.findByRole("button", { name: "Lunch" })
    await userEvent.click(canvas.getByRole("button", { name: "Lunch" }))
    await expect(await canvas.findByText("Opened Lunch")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "+2 more" }))
    const body = within(document.body)
    await userEvent.click(await body.findByRole("button", { name: "Release deadline" }))
    await expect(await canvas.findByText("Opened Release deadline")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("button", { name: "Release deadline" })).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Time slot 14:00:00 - 14:15:00" }))
    await expect(await canvas.findByText("Slot at 2025-01-15 14:00:00")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Time slot All day" }))
    await expect(await canvas.findByText("All day on 2025-01-15")).toBeVisible()
    const first = canvas.getByRole("button", { name: "Time slot 08:00:00 - 08:15:00" })
    first.focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "Time slot 08:15:00 - 08:30:00" })).toHaveFocus())
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{Enter}")
    await waitFor(() => expect(first).toHaveFocus())
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Static 2025-01-15")).toBeVisible()
    await expect(canvas.getByText("★ Design review")).toBeVisible()
    await expect(canvas.getByText("8 AM")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Now" })).toBeVisible()
    await expect(canvas.getAllByText("All day")).toHaveLength(2)
    await expect(canvas.getByText("★ Design conference")).toBeVisible()
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(1)
    await expect(canvasElement.querySelector("[data-partial-business-hours]")).not.toBeNull()
    await expect(canvasElement.querySelector('[data-custom="review"]')).not.toBeNull()
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvas.getByRole("button", { name: "Next" })).toHaveAttribute("data-hint", "forward")
    await expect(canvas.getByRole("button", { name: "Now" })).toHaveAttribute("data-hint", "now")
    await expect(canvas.getByRole("tablist", { name: "Calendar view" })).toHaveAttribute("data-hint", "views")
    await expect(canvas.getByRole("button", { name: "Now" })).toHaveStyle({ letterSpacing: "1px" })
    await expect(canvasElement.querySelectorAll('[data-tone="soft"]').length).toBeGreaterThan(0)
    await expect(canvas.getAllByRole("button", { name: "+2 more" })[0]).toHaveAttribute("data-tone", "quiet")
    await expect(canvasElement.querySelectorAll('[data-slot-hour="09"]')).toHaveLength(4)
  }
}

const gridOf = (canvasElement: HTMLElement) => {
  const grid = canvasElement.querySelector("[data-time-grid]")
  if (!(grid instanceof HTMLElement)) throw new Error("no time grid")

  return grid
}

const yAt = (grid: HTMLElement, minutes: number) => {
  const box = grid.getBoundingClientRect()

  return box.top + (minutes / 360) * box.height + 1
}

const pointer = (target: EventTarget, type: string, clientY: number, options: PointerEventInit = {}) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY,
      button: 0,
      pointerId: 1,
      isPrimary: true,
      ...options
    })
  )

const handleOf = (canvasElement: HTMLElement, id: string, edge: string) => {
  const handle = canvasElement.querySelector(`[data-event-id="${id}"] > [data-resize-edge="${edge}"]`)
  if (handle === null) throw new Error("no handle")

  return handle
}

export const Dragging: StoryObj = {
  render: demoApp(DraggingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const focus = await canvas.findByRole("button", { name: "Focus time" })
    const grid = gridOf(canvasElement)
    pointer(document, "pointermove", yAt(grid, 10))
    pointer(focus, "pointerdown", yAt(grid, 90), { button: 2 })
    pointer(document, "pointerup", yAt(grid, 90))
    pointer(focus, "pointerdown", yAt(grid, 90))
    pointer(document, "pointermove", yAt(grid, 90) + 2)
    await expect(canvasElement.querySelector("[data-drag-preview]")).toBeNull()
    pointer(document, "pointermove", yAt(grid, 5), { clientX: 5000 })
    await waitFor(() => expect(canvasElement.querySelector("[data-drag-preview]")).not.toBeNull())
    await expect(canvasElement.querySelector('[data-event-id="focus"]')).toHaveAttribute("data-dragging")
    pointer(document, "pointerup", yAt(grid, 5))
    await expect(await canvas.findByText("Moved to 08:00")).toBeVisible()
    canvas.getByRole("button", { name: "Focus time" }).click()
    await userEvent.click(canvas.getByRole("button", { name: "Focus time" }))
    await userEvent.click(canvas.getByRole("button", { name: "Focus time" }))
    pointer(canvas.getByRole("button", { name: "Focus time" }), "pointerdown", yAt(grid, 30))
    pointer(document, "pointermove", yAt(grid, 185))
    await waitFor(() => expect(canvasElement.querySelector("[data-drag-preview]")).toHaveAttribute("data-invalid"))
    await userEvent.keyboard("a")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(canvasElement.querySelector("[data-drag-preview]")).toBeNull())
    pointer(canvas.getByRole("button", { name: "Focus time" }), "pointerdown", yAt(grid, 30))
    pointer(document, "pointermove", yAt(grid, 185))
    pointer(document, "pointercancel", yAt(grid, 185))
    await waitFor(() => expect(canvasElement.querySelector("[data-drag-preview]")).toBeNull())
    pointer(document, "pointermove", yAt(grid, 185))
    pointer(canvas.getByRole("button", { name: "Locked" }), "pointerdown", yAt(grid, 290))
    pointer(document, "pointermove", yAt(grid, 10))
    pointer(document, "pointerup", yAt(grid, 10))
    await expect(canvas.getByText("Moved to 08:00")).toBeVisible()
    const title = canvas.getByRole("button", { name: "Interview" }).firstChild
    if (title === null) throw new Error("no title")
    pointer(title, "pointerdown", yAt(grid, 200))
    pointer(document, "pointerup", yAt(grid, 200))
  }
}

export const Resizing: StoryObj = {
  render: demoApp(DraggingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("button", { name: "Interview" })
    const grid = gridOf(canvasElement)
    pointer(handleOf(canvasElement, "7", "end"), "pointerdown", yAt(grid, 240))
    pointer(document, "pointermove", yAt(grid, 240) + 1)
    pointer(document, "pointermove", yAt(grid, 270))
    await waitFor(() => expect(canvasElement.querySelector('[data-event-id="7"]')).toHaveAttribute("data-resizing"))
    pointer(document, "pointerup", yAt(grid, 270))
    await expect(await canvas.findByText("Now 11:00 to 12:30")).toBeVisible()
    pointer(handleOf(canvasElement, "focus", "start"), "pointerdown", yAt(grid, 60))
    pointer(document, "pointermove", yAt(grid, 0))
    pointer(document, "pointerup", yAt(grid, 0))
    await expect(await canvas.findByText("Now 08:00 to 10:30")).toBeVisible()
    pointer(handleOf(canvasElement, "7", "end"), "pointerdown", yAt(grid, 270))
    pointer(document, "pointermove", yAt(grid, 330))
    await waitFor(() => expect(canvasElement.querySelector('[data-event-id="7"]')).toHaveAttribute("data-invalid"))
    pointer(document, "pointerup", yAt(grid, 330))
    await expect(await canvas.findByText("Resize rejected: overlaps locked")).toBeVisible()
    await expect(canvasElement.querySelector('[data-event-id="locked"] [data-resize-edge]')).toBeNull()
  }
}

export const Selecting: StoryObj = {
  render: demoApp(DraggingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "Time slot 08:00:00 - 08:30:00" })
    const grid = gridOf(canvasElement)
    pointer(first, "pointerdown", yAt(grid, 5))
    pointer(document, "pointermove", yAt(grid, 50))
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Time slot 08:30:00 - 09:00:00" })).toHaveAttribute("data-selected")
    )
    pointer(document, "pointerup", yAt(grid, 50))
    await expect(await canvas.findByText("Created 08:00 to 09:00")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "New event" })).toBeVisible()
  }
}

export const Dropping: StoryObj = {
  render: demoApp(DraggingDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Call Sam")
    const grid = gridOf(canvasElement)
    const transfer = new DataTransfer()
    transfer.setData("text/plain", "Call Sam")
    const over = new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      clientY: yAt(grid, 330),
      dataTransfer: transfer
    })
    grid.dispatchEvent(over)
    await expect(over.defaultPrevented).toBe(true)
    grid.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, clientY: yAt(grid, 330) }))
    grid.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, clientY: yAt(grid, 330), dataTransfer: transfer })
    )
    await expect(await canvas.findByText("Dropped at 13:30")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Call Sam" })).toBeVisible()
  }
}
