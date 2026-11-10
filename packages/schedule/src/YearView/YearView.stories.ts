import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/YearView" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("2025")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "March" })).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: "January 15, 2025" })[0]).toHaveAttribute("data-today")
    await expect(canvasElement.querySelectorAll("[data-today]").length).toBeGreaterThan(0)
    const sixth = canvas.getAllByRole("button", { name: "January 6, 2025" })[0]
    await expect(sixth?.querySelectorAll("span span")).toHaveLength(3)
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "February" }))
    await expect(await canvas.findByText("Month of 2025-02-01")).toBeVisible()
    const day = canvas.getAllByRole("button", { name: "March 12, 2025" })[0]
    if (day === undefined) throw new Error("no day")
    await userEvent.click(day)
    await expect(await canvas.findByText("Day 2025-03-12")).toBeVisible()
    const week = canvas.getAllByRole("button", { name: "Week 11" })[0]
    if (week === undefined) throw new Error("no week")
    await userEvent.click(week)
    await expect(await canvas.findByText("Week of 2025-03-10")).toBeVisible()
    const first = canvas.getAllByRole("button", { name: "January 31, 2025" })[0]
    if (first === undefined) throw new Error("no day")
    first.focus()
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(document.activeElement).toHaveAttribute("aria-label", "February 1, 2025"))
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}")
    await waitFor(() => expect(document.activeElement).toHaveAttribute("data-outside"))
    await expect(document.activeElement).toHaveAttribute("aria-label", "January 31, 2025")
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("2026")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Today" }))
    await expect(await canvas.findByText("2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("tab", { name: "Switch to month view" }))
    await expect(await canvas.findByText("Switch to month")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Year 2025")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Jun" })).toBeVisible()
    await expect(canvas.getAllByText("Mon").length).toBeGreaterThan(0)
    await expect(canvas.queryByText("Sat")).toBeNull()
    await expect(canvasElement.querySelectorAll("[data-day-placeholder]").length).toBeGreaterThan(0)
    await expect(canvasElement.querySelector('[data-day="2025-01-15"]')).not.toBeNull()
    await expect(canvasElement.querySelector("[data-week-start]")).not.toBeNull()
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]')).toHaveLength(12)
    await expect(canvas.getByRole("button", { name: "Previous" })).toHaveAttribute("data-hint", "back")
    await expect(canvas.getAllByText("2*").length).toBeGreaterThan(0)
  }
}
