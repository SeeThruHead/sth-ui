import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/YearPicker" }

export default meta

const section = async (canvasElement: HTMLElement, title: string) =>
  within(present((await within(canvasElement).findByText(new RegExp(`^${title}:`))).parentElement))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const one = await section(canvasElement, "One")
    await expect(await one.findByRole("button", { name: "2025" })).toBeVisible()
    await expect(one.getByText("One: none")).toBeVisible()
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const one = await section(canvasElement, "One")
    await userEvent.click(await one.findByRole("button", { name: "2025" }))
    await expect(await one.findByText("One: 2025-01-01")).toBeVisible()
    await expect(one.getByRole("button", { name: "2025" })).toHaveAttribute("data-selected")
    const several = await section(canvasElement, "Several")
    await userEvent.click(several.getByRole("button", { name: "2025" }))
    await userEvent.click(several.getByRole("button", { name: "2027" }))
    await expect(await several.findByText("Several: 2025-01-01 to 2027-01-01")).toBeVisible()
    const range = await section(canvasElement, "Range")
    await userEvent.click(range.getByRole("button", { name: "2027" }))
    await userEvent.hover(range.getByRole("button", { name: "2025" }))
    await waitFor(() => expect(range.getByRole("button", { name: "2026" })).toHaveAttribute("data-in-range"))
    await userEvent.click(range.getByRole("button", { name: "2025" }))
    await expect(await range.findByText("Range: 2025-01-01 to 2027-01-01")).toBeVisible()
  }
}
