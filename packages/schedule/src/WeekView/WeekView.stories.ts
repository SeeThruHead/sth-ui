import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/WeekView" }

export default meta

const columnOf = (canvasElement: HTMLElement, date: string) => {
  const column = canvasElement.querySelector(`[data-time-grid][data-date="${date}"]`)
  if (!(column instanceof HTMLElement)) throw new Error(`no column for ${date}`)

  return column
}

const at = (column: HTMLElement, minutes: number) => {
  const box = column.getBoundingClientRect()

  return { clientX: box.left + box.width / 2, clientY: box.top + (minutes / 600) * box.height + 1 }
}

const pointer = (target: EventTarget, type: string, point: { readonly clientX: number; readonly clientY: number }) =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...point })
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Jan 13 – Jan 19, 2025")).toBeVisible()
    await expect(canvas.getByText("3")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Weekday 2025-01-15" })).toHaveAttribute("data-today")
    await expect(canvas.getByRole("button", { name: "Weekday 2025-01-18" })).toHaveAttribute("data-weekend")
    await expect(canvas.getAllByRole("button", { name: "Standup" })).toHaveLength(5)
    await expect(canvas.getByRole("button", { name: "Team offsite" }).closest("[data-hanging]")).toHaveAttribute(
      "data-hanging",
      "start"
    )
    await expect(canvas.getByRole("button", { name: "Launch week" }).closest("[data-hanging]")).toHaveAttribute(
      "data-hanging",
      "end"
    )
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(1)
    await expect(canvas.getByText("Office closed")).toBeInTheDocument()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Weekday 2025-01-16" }))
    await expect(await canvas.findByText("Open 2025-01-16")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "All day 2025-01-14" }))
    await expect(await canvas.findByText("All day on 2025-01-14")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Interview" }))
    await expect(await canvas.findByText("Opened Interview")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Lunch" }))
    await expect(await canvas.findByText("Opened Lunch")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Holiday" }))
    await expect(await canvas.findByText("Opened Holiday")).toBeVisible()
    const slots = canvas.getAllByRole("button", { name: "Time slot 13:00:00 - 13:30:00" })
    await userEvent.click(slots[2] ?? slots[0] ?? canvasElement)
    await expect(await canvas.findByText("Slot at 2025-01-15 13:00:00")).toBeVisible()
    const monday = columnOf(canvasElement, "2025-01-13").querySelector("[data-time-slot]")
    if (!(monday instanceof HTMLElement)) throw new Error("no slot")
    monday.focus()
    await userEvent.keyboard("{ArrowRight}{ArrowDown}")
    await waitFor(() =>
      expect(columnOf(canvasElement, "2025-01-14").querySelectorAll("[data-time-slot]")[1]).toHaveFocus()
    )
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    await waitFor(() =>
      expect(columnOf(canvasElement, "2025-01-13").querySelectorAll("[data-time-slot]")[1]).toHaveFocus()
    )
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("Jan 20 – Jan 26, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await userEvent.click(canvas.getByRole("button", { name: "Today" }))
    await expect(await canvas.findByText("Jan 13 – Jan 19, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to month view" }))
    await expect(await canvas.findByText("Switch to month")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await expect(await canvas.findByText("January 13, 2025 – January 19, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await canvas.findByRole("button", { name: "Interview" })
  }
}

export const DraggingAcrossDays: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const interview = await canvas.findByRole("button", { name: "Interview" })
    const wednesday = columnOf(canvasElement, "2025-01-15")
    const friday = columnOf(canvasElement, "2025-01-17")
    pointer(interview, "pointerdown", at(wednesday, 370))
    pointer(document, "pointermove", at(friday, 120))
    await waitFor(() => expect(friday.querySelector("[data-drag-preview]")).not.toBeNull())
    await expect(wednesday.querySelector("[data-drag-preview]")).toBeNull()
    pointer(document, "pointerup", at(friday, 120))
    await expect(await canvas.findByText("Moved to 2025-01-17 10:00:00")).toBeVisible()
    pointer(
      columnOf(canvasElement, "2025-01-16").querySelector("[data-time-slot]") ?? document,
      "pointerdown",
      at(columnOf(canvasElement, "2025-01-16"), 5)
    )
    pointer(document, "pointermove", at(columnOf(canvasElement, "2025-01-16"), 65))
    pointer(document, "pointerup", at(columnOf(canvasElement, "2025-01-16"), 65))
    await expect(await canvas.findByText("Created 2025-01-16 08:00:00")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("2025-01-13 to 2025-01-17")).toBeVisible()
    await expect(canvas.getByText("Wednesday")).toBeVisible()
    await expect(canvas.queryByText("Saturday")).toBeNull()
    await expect(canvas.getByRole("tab", { name: "Switch to week view" })).toHaveTextContent("Wk")
    await expect(canvasElement.querySelectorAll("[data-current-time]")).toHaveLength(1)
    await expect(canvas.getAllByText("All day")).toHaveLength(1)
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]')).toHaveLength(7)
  }
}

export const DraggingAllDay: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const holiday = await canvas.findByRole("button", { name: "Holiday" })
    const box = holiday.getBoundingClientRect()
    const start = { clientX: box.left + 10, clientY: box.top + box.height / 2 }
    const tuesday = columnOf(canvasElement, "2025-01-14").getBoundingClientRect()
    const target = { clientX: tuesday.left + tuesday.width / 2, clientY: start.clientY }
    pointer(holiday, "pointerdown", start)
    pointer(document, "pointermove", target)
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "All day 2025-01-14" })).toHaveAttribute("data-drop-target")
    )
    await expect(holiday.closest("[data-event-id]")).toHaveAttribute("data-dragging")
    pointer(document, "pointerup", target)
    await expect(await canvas.findByText("Moved to 2025-01-14 00:00:00")).toBeVisible()
  }
}
