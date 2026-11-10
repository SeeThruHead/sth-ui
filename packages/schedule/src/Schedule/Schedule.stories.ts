import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as MobileDemo from "./demos/mobile.ts"
import * as RecurringDemo from "./demos/recurring.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/Schedule" }

export default meta

const shows = (canvas: ReturnType<typeof within>, text: string) =>
  waitFor(() =>
    expect(
      canvas.getAllByText(text).filter((element: HTMLElement) => element.checkVisibility()).length
    ).toBeGreaterThan(0)
  )

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await shows(canvas, "Jan 13 – Jan 19, 2025")
    await expect(canvas.getByRole("tab", { name: "Switch to week view" })).toHaveAttribute("aria-selected", "true")
  }
}

export const SwitchingViews: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("tab", { name: "Switch to day view" }))
    await shows(canvas, "January 15, 2025")
    await shows(canvas, "View day")
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await shows(canvas, "January 16, 2025")
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to month view" }))
    await shows(canvas, "January 2025")
    await userEvent.click(canvas.getByRole("button", { name: "January 20, 2025" }))
    await shows(canvas, "Day 2025-01-20")
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to year view" }))
    await shows(canvas, "2025")
    await userEvent.click(canvas.getByRole("button", { name: "March" }))
    await shows(canvas, "March 2025")
    await shows(canvas, "Date 2025-03-01, View month")
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to year view" }))
    await canvas.findByRole("button", { name: "April" })
    const day = canvas.getAllByRole("button", { name: "April 2, 2025" })[0]
    if (day === undefined) throw new Error("no day")
    await userEvent.click(day)
    await shows(canvas, "Day 2025-04-02")
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to week view" }))
    await userEvent.click(await canvas.findByRole("button", { name: "Agenda" }))
    await shows(canvas, "No events")
  }
}

export const Mobile: StoryObj = {
  render: demoApp(MobileDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await shows(canvas, "Wednesday, January 15")
    await expect(canvas.getByRole("button", { name: "Week 3" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "January 17, 2025" }))
    await shows(canvas, "Friday, January 17")
    await userEvent.click(canvas.getByRole("button", { name: "2025" }))
    await expect(await canvas.findByRole("button", { name: "March" })).toBeVisible()
  }
}

export const Recurring: StoryObj = {
  render: demoApp(RecurringDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("button", { name: "Weekly planning (moved)" })).toHaveLength(2)
    await expect(canvas.getAllByRole("button", { name: "Weekly planning" }).length).toBeGreaterThan(1)
    await expect(canvas.getAllByRole("button", { name: "Dentist" })).toHaveLength(2)
    const week = canvas.getByRole("button", { name: "January 22, 2024" }).closest("[data-month-week]")
    if (!(week instanceof HTMLElement)) throw new Error("no week")
    await expect(within(week).getAllByRole("button", { name: "Weekly planning" })).toHaveLength(1)
  }
}
