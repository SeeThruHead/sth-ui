import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as PresetsDemo from "./demos/presets.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/DatePicker" }

export default meta

const section = async (canvasElement: HTMLElement, title: string) =>
  within(present((await within(canvasElement).findByText(new RegExp(`^${title}:`))).parentElement))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const date = await section(canvasElement, "Date")
    await expect(await date.findByText("Date: 2024-05-14")).toBeVisible()
    await expect(date.getByRole("button", { name: "14 May 2024" })).toHaveAttribute("data-selected")
    await expect(date.getByRole("button", { name: "14 May 2024" })).toHaveAttribute("tabindex", "0")
    await expect((await section(canvasElement, "Range")).getByText("Range: none")).toBeVisible()
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const date = await section(canvasElement, "Date")
    await userEvent.click(await date.findByRole("button", { name: "20 May 2024" }))
    await expect(await date.findByText("Date: 2024-05-20")).toBeVisible()
    await userEvent.click(date.getByRole("button", { name: "20 May 2024" }))
    await expect(await date.findByText("Date: none")).toBeVisible()
    const several = await section(canvasElement, "Dates")
    await userEvent.click(several.getByRole("button", { name: "2 May 2024" }))
    await userEvent.click(several.getByRole("button", { name: "7 May 2024" }))
    await expect(await several.findByText("Dates: 2024-05-02 to 2024-05-07")).toBeVisible()
    await userEvent.click(several.getByRole("button", { name: "2 May 2024" }))
    await expect(await several.findByText("Dates: 2024-05-07")).toBeVisible()
    await userEvent.click(date.getByRole("button", { name: "21 May 2024" }))
    await expect(await date.findByText("Date: 2024-05-21")).toBeVisible()
    await userEvent.click(date.getByRole("button", { name: "Previous" }))
    await userEvent.click(await date.findByText("April 2024"))
    await waitFor(() => expect(date.getByRole("button", { name: "May 2024" })).toHaveAttribute("data-selected"))
    await userEvent.click(date.getByText("2024"))
    await waitFor(() => expect(date.getByRole("button", { name: "2024" })).toHaveAttribute("data-selected"))
  }
}

export const PickingARange: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const range = await section(canvasElement, "Range")
    await userEvent.click(await range.findByRole("button", { name: "20 May 2024" }))
    await expect(await range.findByText("Range: 2024-05-20")).toBeVisible()
    await userEvent.hover(range.getByRole("button", { name: "15 May 2024" }))
    await waitFor(() => expect(range.getByRole("button", { name: "17 May 2024" })).toHaveAttribute("data-in-range"))
    await waitFor(() =>
      expect(range.getByRole("button", { name: "20 May 2024" })).toHaveAttribute("data-last-in-range")
    )
    await userEvent.unhover(range.getByRole("button", { name: "15 May 2024" }))
    await userEvent.hover(range.getByText("Range: 2024-05-20"))
    await waitFor(() => expect(range.getByRole("button", { name: "17 May 2024" })).not.toHaveAttribute("data-in-range"))
    await userEvent.click(range.getByRole("button", { name: "15 May 2024" }))
    await expect(await range.findByText("Range: 2024-05-15 to 2024-05-20")).toBeVisible()
    await expect(range.getByRole("button", { name: "15 May 2024" })).toHaveAttribute("data-first-in-range")
  }
}

export const Presets: StoryObj = {
  render: demoApp(PresetsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Last 7 days" })).toBeVisible()
    await expect(canvas.getByText("May 2024")).toBeVisible()
    await expect(canvas.getByText("June 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "20 May 2024" })).toBeDisabled()
    await expect(canvasElement.querySelector("[data-date='2024-06-01'][data-outside]")).toHaveAttribute("data-hidden")
  }
}

export const ChoosingAPreset: StoryObj = {
  render: demoApp(PresetsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Next" }))
    await userEvent.click(canvas.getByRole("button", { name: "Last month" }))
    await expect(await canvas.findByText("Range: 2024-04-01 to 2024-04-30")).toBeVisible()
    await expect(canvas.getByText("April 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "12 April 2024" })).toHaveAttribute("data-in-range")
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }))
    await expect(await canvas.findByText("Range: none")).toBeVisible()
  }
}
