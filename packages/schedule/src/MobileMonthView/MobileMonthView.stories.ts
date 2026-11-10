import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/MobileMonthView" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 2025")).toBeVisible()
    await expect(canvas.getByText("Monday, January 6")).toBeVisible()
    await expect(canvas.getByRole("button", { name: /Design review 11:00 – 12:00/ })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "January 6, 2025" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByRole("button", { name: "January 15, 2025" })).toHaveAttribute("data-today")
    await expect(canvas.getByRole("button", { name: "January 6, 2025" }).querySelectorAll("span span")).toHaveLength(3)
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "January 1, 2025" }))
    await expect(await canvas.findByText("Wednesday, January 1")).toBeVisible()
    await expect(canvas.getByText("All day")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "January 4, 2025" }))
    await expect(await canvas.findByText("No events")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Week 3" }))
    await expect(await canvas.findByText("Week of 2025-01-13")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "2025" }))
    await expect(await canvas.findByText("Back to the year")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "January 15, 2025" }))
    await userEvent.click(await canvas.findByRole("button", { name: /Release/ }))
    await expect(await canvas.findByText("Opened Release")).toBeVisible()
    canvas.getByRole("button", { name: "January 15, 2025" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(canvas.getByRole("button", { name: "January 22, 2025" })).toHaveFocus())
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Events on 2025-01-20")).toBeVisible()
    await expect(canvas.getByText("Custom header for 2025-01-15")).toBeVisible()
    await expect(canvasElement.querySelectorAll("[data-hidden]").length).toBeGreaterThan(0)
    await expect(canvasElement.querySelector('[data-day="2025-01-15"]')).not.toBeNull()
    await expect(canvasElement.querySelector("[data-week-start]")).not.toBeNull()
    await expect(canvasElement.querySelector("[data-custom]")).not.toBeNull()
    await expect(canvasElement.querySelectorAll('[data-tone="quiet"]')).toHaveLength(5)
    await expect(canvas.getByText("Wednesday, March 12")).toBeVisible()
    await expect(canvas.getAllByText("No events")).toHaveLength(1)
  }
}
