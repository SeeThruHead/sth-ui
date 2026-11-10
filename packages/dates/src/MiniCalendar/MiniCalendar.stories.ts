import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/MiniCalendar" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-09" })).toHaveAttribute("data-selected")
    await expect(canvas.getByRole("button", { name: "2024-05-12" })).toHaveTextContent("May12")
    await expect(canvas.getByRole("button", { name: "2024-12-28" })).toHaveTextContent("décembre28")
    await expect(canvas.getByRole("button", { name: "2025-01-01" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "2025-01-01" })).toHaveAttribute("data-holiday")
    await expect(canvas.getByRole("button", { name: "2024-08-06" })).toHaveAttribute("data-selected")
    await expect(canvas.getByRole("button", { name: "2024-08-07" })).toHaveTextContent("M087")
    await expect(canvas.getByText("›")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Suivant" })).toHaveAttribute("data-direction", "next")
  }
}

export const Paging: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "2024-05-11" }))
    await expect(await canvas.findByText("Selected 2024-05-11")).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Next" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-13" })).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Next" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-26" })).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Next" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-06-02" })).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: "Next" })[0]).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "2024-06-01" })).toBeDisabled()
    await userEvent.click(canvas.getAllByRole("button", { name: "Previous" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-20" })).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Previous" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-13" })).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Previous" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-05-06" })).toBeVisible()
    await userEvent.click(canvas.getAllByRole("button", { name: "Previous" })[0] ?? canvasElement)
    await expect(await canvas.findByRole("button", { name: "2024-04-29" })).toBeDisabled()
    await expect(canvas.getAllByRole("button", { name: "Previous" })[0]).toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Précédent" }))
    await expect(await canvas.findByRole("button", { name: "2024-12-23" })).toBeVisible()
  }
}
