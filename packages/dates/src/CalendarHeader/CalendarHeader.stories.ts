import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/CalendarHeader" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole("button", { name: "Change level" })).toHaveTextContent("2024"))
    await expect(canvas.getByRole("button", { name: "March 2024" })).toHaveAttribute("data-selected")
    await expect(canvas.getByRole("button", { name: "March 2024" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "January 2024" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "February 2024" })).not.toBeDisabled()
    await expect(canvas.getByRole("button", { name: "mai 2024" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "mai 2024" })).toHaveTextContent("mai")
    await expect(canvas.getByRole("button", { name: "2036" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "2034" })).toHaveAttribute("tabindex", "-1")
    await expect(canvas.getByRole("button", { name: "2034" })).toHaveTextContent("34")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "2034" })).fontWeight).toBe("700")
    await expect(canvas.getByRole("button", { name: "Solo" }).getBoundingClientRect().height).toBe(36)
    await expect(canvas.getByRole("button", { name: "2047" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "2046" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "2044" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Back" })).toBeDisabled()
    await expect(canvas.getByText("Static")).toHaveAttribute("data-static")
    await expect(getComputedStyle(canvas.getByText("Static")).fontWeight).toBe("700")
    await expect(canvas.getByText("Static").getBoundingClientRect().height).toBe(48)
    await expect(canvas.queryAllByRole("button", { name: "Next" })).toHaveLength(2)
    await expect(canvas.queryAllByRole("button", { name: "Previous" })).toHaveLength(1)
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.hover(await canvas.findByRole("button", { name: "May 2024" }))
    await userEvent.click(canvas.getByRole("button", { name: "May 2024" }))
    await expect(await canvas.findByText("Picked 2024-05-01; hovering 2024-05-01")).toBeVisible()
    await userEvent.click(present(canvas.getAllByRole("button", { name: "Next" })[0]))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Change level" })).toHaveTextContent("2025"))
    await expect(canvas.getByRole("button", { name: "January 2025" })).toHaveAttribute("tabindex", "0")
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await userEvent.click(canvas.getByRole("button", { name: "Change level" }))
    await expect(await canvas.findByText("2020 – 2029")).toHaveAttribute("data-static")
    await expect(canvas.getByRole("button", { name: "2022" })).toHaveAttribute("data-in-range")
    await expect(canvas.getByRole("button", { name: "2021" })).toHaveAttribute("data-first-in-range")
    await expect(canvas.getByRole("button", { name: "2028" })).toBeDisabled()
    await userEvent.hover(canvas.getByRole("button", { name: "2023" }))
    await expect(await canvas.findByText(/hovering 2023-01-01/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "2026" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Change level" })).toHaveTextContent("2026"))
    await expect(present(canvas.getAllByRole("button", { name: "Next" })[0])).toBeDisabled()
  }
}
