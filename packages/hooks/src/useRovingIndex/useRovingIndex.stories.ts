import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Hooks/useRovingIndex" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Bold" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "Italic" })).toHaveAttribute("tabindex", "-1")
  }
}

export const Navigating: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Bold" }))
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await expect(canvas.getByRole("button", { name: "Underline" })).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("button", { name: "Code" })).toHaveFocus()
    await expect(await canvas.findByText("Focused: Code")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Code" })).toHaveAttribute("tabindex", "0")
    await userEvent.keyboard("{Home}")
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await userEvent.click(canvas.getByRole("toolbar"))
    await userEvent.click(canvas.getByRole("button", { name: "Italic" }))
    await expect(await canvas.findByText("Focused: Italic")).toBeVisible()
    const grid = canvas.getByRole("grid", { name: "Days" })
    await userEvent.click(within(grid).getByRole("button", { name: "1" }))
    await userEvent.keyboard("{ArrowDown}")
    await expect(within(grid).getByRole("button", { name: "4" })).toHaveFocus()
    await expect(await canvas.findByText("Day 4 chosen")).toBeVisible()
  }
}
