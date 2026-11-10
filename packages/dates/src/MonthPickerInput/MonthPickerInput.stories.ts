import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/MonthPickerInput" }

export default meta

const page = within(document.body)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Pick month" })).toHaveTextContent("Pick month")
    await expect(canvas.getByRole("button", { name: "Disabled" })).toBeDisabled()
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const one = await canvas.findByRole("button", { name: "Pick month" })
    await userEvent.click(one)
    await userEvent.click(await page.findByRole("button", { name: "June 2024" }))
    await waitFor(() => expect(one).toHaveTextContent("June 2024"))
    await waitFor(() => expect(page.queryByRole("button", { name: "June 2024" })).toBeNull())
    const range = canvas.getByRole("button", { name: "Pick a range" })
    await userEvent.click(range)
    await userEvent.click(await page.findByRole("button", { name: "August 2024" }))
    await userEvent.click(page.getByRole("button", { name: "June 2024" }))
    await waitFor(() => expect(range).toHaveTextContent("June 2024 – August 2024"))
  }
}
