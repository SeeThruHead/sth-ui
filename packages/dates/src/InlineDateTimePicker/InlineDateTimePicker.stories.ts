import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/InlineDateTimePicker" }

export default meta

const section = async (canvasElement: HTMLElement, title: string) =>
  within(present((await within(canvasElement).findByText(new RegExp(`^${title}:`))).parentElement))

const byId = (canvasElement: HTMLElement, id: string) =>
  present(canvasElement.querySelector<HTMLInputElement>(`#${id}`))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const single = await section(canvasElement, "Single")
    await expect(single.getByRole("button", { name: "14 May 2024" })).toHaveAttribute("data-selected")
    await expect(byId(canvasElement, "single-start-hours")).toHaveValue("10")
    await expect(byId(canvasElement, "single-start-minutes")).toHaveValue("30")
    await expect(single.getByRole("button", { name: "2 May 2024" })).toBeDisabled()
    await expect(single.getByRole("button", { name: "Submit" })).toBeVisible()
    const range = await section(canvasElement, "Range")
    await expect(byId(canvasElement, "range-start-amPm")).toHaveValue("AM")
    await expect(range.getByRole("button", { name: "Done" })).toBeVisible()
  }
}

export const PickingADateAndTime: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const single = await section(canvasElement, "Single")
    await userEvent.click(single.getByRole("button", { name: "20 May 2024" }))
    await expect(await single.findByText("Single: 2024-05-20 10:30:00; submitted 0")).toBeVisible()
    await waitFor(() => expect(byId(canvasElement, "single-start-hours")).toHaveFocus())
    await userEvent.keyboard("16")
    await waitFor(() => expect(single.getByText(/^Single: 2024-05-20 16:30:00/)).toBeVisible())
    await userEvent.keyboard("{Enter}")
    await expect(await single.findByText("Single: 2024-05-20 16:30:00; submitted 1")).toBeVisible()
    await userEvent.click(single.getByRole("button", { name: "Submit" }))
    await expect(await single.findByText(/submitted 2/)).toBeVisible()
    await userEvent.click(single.getByRole("button", { name: "28 May 2024" }))
    await expect(await single.findByText(/^Single: 2024-05-28 16:30:00/)).toBeVisible()
    await userEvent.click(single.getByText("May 2024"))
    await waitFor(() => expect(canvasElement.querySelector("#single-start-hours")).toBeNull())
  }
}

export const PickingARange: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const range = await section(canvasElement, "Range")
    await userEvent.click(range.getByRole("button", { name: "10 May 2024" }))
    await expect(await range.findByText("10/05/2024 10:00:00 – ...")).toBeVisible()
    await userEvent.click(range.getByRole("button", { name: "12 May 2024" }))
    await expect(await range.findByText("10/05/2024 10:00:00 – 12/05/2024 10:00:00")).toBeVisible()
    await waitFor(() => expect(byId(canvasElement, "range-start-hours")).toHaveFocus())
    byId(canvasElement, "range-end-amPm").focus()
    await userEvent.keyboard("p")
    await expect(await range.findByText(/to 2024-05-12 22:00:00/)).toBeVisible()
    await userEvent.click(range.getByRole("button", { name: "Done" }))
    await expect(await range.findByText(/submitted 1/)).toBeVisible()
  }
}
