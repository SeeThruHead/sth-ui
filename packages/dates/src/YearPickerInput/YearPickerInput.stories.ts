import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/YearPickerInput" }

export default meta

const page = within(document.body)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Pick year" })).toHaveTextContent("Pick year")
    await expect(canvas.getByRole("button", { name: "Disabled" })).toBeDisabled()
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const one = await canvas.findByRole("button", { name: "Pick year" })
    await userEvent.click(one)
    await userEvent.click(await page.findByRole("button", { name: "2026" }))
    await waitFor(() => expect(one).toHaveTextContent("2026"))
    await waitFor(() => expect(page.queryByRole("button", { name: "2026" })).toBeNull())
    const range = canvas.getByRole("button", { name: "Pick a range" })
    await userEvent.click(range)
    await userEvent.click(await page.findByRole("button", { name: "2028" }))
    await userEvent.click(page.getByRole("button", { name: "2026" }))
    await waitFor(() => expect(range).toHaveTextContent("2026 – 2028"))
  }
}
