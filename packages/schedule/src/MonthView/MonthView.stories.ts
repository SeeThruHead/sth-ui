import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/MonthView" }

export default meta

const centre = (element: Element) => {
  const box = element.getBoundingClientRect()

  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
}

const pointer = (target: EventTarget, type: string, point: { readonly clientX: number; readonly clientY: number }) =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, ...point })
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 2025")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "January 15, 2025" })).toHaveAttribute("data-today")
    await expect(canvas.getByRole("button", { name: "December 30, 2024" })).toHaveAttribute("data-outside")
    await expect(canvas.getByRole("button", { name: "January 18, 2025" })).toHaveAttribute("data-weekend")
    await expect(canvas.getAllByRole("button", { name: "Standup" })).toHaveLength(4)
    await expect(canvas.getAllByRole("button", { name: "+1 more" }).length).toBeGreaterThan(0)
    await expect(canvas.getByRole("button", { name: "Week 3" })).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: "Sprint" })[0]?.closest("[data-hanging]")).toHaveAttribute(
      "data-hanging",
      "end"
    )
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "January 22, 2025" }))
    await expect(await canvas.findByText("Day 2025-01-22")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Week 3" }))
    await expect(await canvas.findByText("Week of 2025-01-13")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Release" }))
    await expect(await canvas.findByText("Opened Release")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Office closed" }))
    await expect(await canvas.findByText("Opened Office closed")).toBeVisible()
    canvas.getByRole("button", { name: "January 15, 2025" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "January 22, 2025" })).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "January 23, 2025" })).toHaveFocus())
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "January 16, 2025" })).toHaveFocus())
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "January 15, 2025" })).toHaveFocus())
    const more = canvas.getAllByRole("button", { name: "+1 more" })[0]
    if (more === undefined) throw new Error("no more button")
    await userEvent.click(more)
    const body = within(document.body)
    await userEvent.click(await body.findByRole("button", { name: "Team lunch" }))
    await expect(await canvas.findByText("Opened Team lunch")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("February 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await userEvent.click(canvas.getByRole("button", { name: "Today" }))
    await expect(await canvas.findByText("January 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await expect(await canvas.findByText("Switch to week")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await expect(await canvas.findByText("January 1, 2025 – January 31, 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Agenda" }))
    await canvas.findByRole("button", { name: "Release" })
  }
}

export const Dragging: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const release = await canvas.findByRole("button", { name: "Release" })
    const target = centre(canvas.getByRole("button", { name: "January 23, 2025" }))
    pointer(release, "pointerdown", centre(release))
    pointer(document, "pointermove", target)
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "January 23, 2025" })).toHaveAttribute("data-drop-target")
    )
    pointer(document, "pointerup", target)
    await expect(await canvas.findByText("Moved to 2025-01-23 10:00:00")).toBeVisible()
    const from = canvas.getByRole("button", { name: "January 27, 2025" })
    pointer(from, "pointerdown", centre(from))
    pointer(document, "pointermove", centre(canvas.getByRole("button", { name: "January 29, 2025" })))
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "January 28, 2025" })).toHaveAttribute("data-drag-selected")
    )
    pointer(document, "pointerup", centre(canvas.getByRole("button", { name: "January 29, 2025" })))
    await expect(await canvas.findByText("Created 2025-01-27 00:00:00 to 2025-01-29 23:59:59")).toBeVisible()
    const transfer = new DataTransfer()
    transfer.setData("text/plain", "Call")
    const day = canvas.getByRole("button", { name: "January 30, 2025" })
    day.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer, ...centre(day) })
    )
    await expect(await canvas.findByText("Dropped at 2025-01-30 00:00:00")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Month of 2025-01")).toBeVisible()
    await expect(canvas.getAllByText("Monday")).toHaveLength(1)
    await expect(canvas.queryByText("Saturday")).toBeNull()
    await expect(canvas.getAllByText("• Sprint")[0]).toBeVisible()
    await expect(canvas.getByRole("button", { name: "• Workshop" }).closest("[data-event-id]")).toHaveAttribute(
      "data-clip-start"
    )
    await expect(canvas.getByRole("button", { name: "• Workshop" }).closest("[data-event-id]")).toHaveAttribute(
      "data-clip-end"
    )
    await expect(canvasElement.querySelector('[data-day="2025-01-15"]')).not.toBeNull()
    await expect(canvasElement.querySelector("[data-week-start]")).not.toBeNull()
    await expect(canvasElement.querySelector('[data-custom="x"]')).not.toBeNull()
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]')).toHaveLength(5)
  }
}
