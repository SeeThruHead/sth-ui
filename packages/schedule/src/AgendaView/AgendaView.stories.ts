import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Schedule/AgendaView" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("January 14, 2025 – January 16, 2025")).toBeVisible()
    await expect(canvas.getByText("Wednesday, January 15")).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: /Standup/ })).toHaveLength(3)
    await expect(canvas.getByRole("button", { name: /Design review 09:00 – 11:00/ })).toBeVisible()
    await expect(canvas.getAllByText("All day").length).toBeGreaterThan(0)
    await expect(canvas.queryByText("Lunch")).toBeNull()
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: /Retrospective/ }))
    await expect(await canvas.findByText("Opened Retrospective")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Jan 15 – Jan 15")).toBeVisible()
    await expect(canvas.getByText("Day 15")).toBeVisible()
    await expect(canvasElement.querySelector('[data-custom="review"]')).not.toBeNull()
    await expect(canvas.getByText("Nothing planned")).toBeVisible()
  }
}
