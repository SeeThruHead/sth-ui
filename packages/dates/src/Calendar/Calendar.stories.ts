import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/Calendar" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("May 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "9 May 2024" })).toHaveAttribute("data-today")
    await expect(canvas.getByRole("button", { name: "9 May 2024" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "Previous" })).toBeVisible()
  }
}

export const Navigating: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("June 2024")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }))
    await expect(await canvas.findByText("April 2024")).toBeVisible()
    await userEvent.click(canvas.getByText("April 2024"))
    await userEvent.click(await canvas.findByText("2024"))
    await expect(await canvas.findByText("2020 – 2029")).toHaveAttribute("data-static")
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(await canvas.findByText("2030 – 2039")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "2031" }))
    await userEvent.click(await canvas.findByRole("button", { name: "March 2031" }))
    await expect(await canvas.findByText("March 2031")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "14 March 2031" }))
    await expect(await canvas.findByText(/Picked 2031-03-14/)).toBeVisible()
    await expect(canvas.getByText(/MonthSelected, LevelChanged/)).toBeVisible()
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "31 May 2024" }))
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("button", { name: "31 May 2024" })).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}{ArrowUp}")
    await expect(canvas.getByRole("button", { name: "23 May 2024" })).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await expect(canvas.getByRole("button", { name: "30 May 2024" })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard("{Meta>}{ArrowDown}{/Meta}")
    await expect(await canvas.findByText("May 2025")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    canvas.getByRole("button", { name: "Next" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(canvas.getByRole("button", { name: "Next" })).toHaveFocus()
    await userEvent.keyboard("{Control>}{ArrowLeft}{/Control}")
    await userEvent.keyboard("{Control>}{Shift>}{ArrowUp}{/Shift}{/Control}")
    await expect(await canvas.findByText("June 2015")).toBeVisible()
    await userEvent.keyboard("y")
    await expect(await canvas.findByRole("button", { name: "September 2015" })).toBeVisible()
    canvas.getByRole("button", { name: "June 2015" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(canvas.getByRole("button", { name: "September 2015" })).toHaveFocus()
  }
}

export const Options: StoryObj = {
  render: demoApp(OptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("May 2024")).toBeVisible()
    await expect(canvas.getByText("Jun 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Previous month" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Next month" })).toBeVisible()
    await expect(canvas.getAllByRole("button", { name: "Pick a month" })).toHaveLength(2)
    await expect(canvas.getByText("20 – 29")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Previous decade" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "2026" })).toHaveAttribute("data-selected")
    await expect(getComputedStyle(canvas.getByText("20 – 29")).fontWeight).toBe("700")
    await expect(canvas.getByText("February 2024")).toHaveAttribute("data-static")
    await expect(canvas.getByText("‹")).toBeVisible()
    await expect(present(canvasElement.querySelector("[data-date='2024-02-14']")).tagName).toBe("DIV")
  }
}

export const NavigatingOptions: StoryObj = {
  render: demoApp(OptionsDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Previous month" })).not.toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Previous month" }))
    await expect(await canvas.findByText("Mar 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Previous month" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "9 April 2024" })).toBeDisabled()
    canvas.getByRole("button", { name: "10 April 2024" }).focus()
    await userEvent.keyboard("{ArrowLeft}")
    await expect(canvas.getByRole("button", { name: "10 April 2024" })).toHaveFocus()
    await userEvent.click(canvas.getByRole("button", { name: "Next month" }))
    await userEvent.click(canvas.getByRole("button", { name: "Next month" }))
    await userEvent.click(canvas.getByRole("button", { name: "Next month" }))
    await expect(await canvas.findByText("Jul 2024")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Next month" })).toBeDisabled()
    await userEvent.click(present(canvas.getAllByRole("button", { name: "Pick a month" })[0]))
    await expect(await canvas.findByText("Year 2024")).toBeVisible()
    await expect(canvas.queryByRole("button", { name: "Pick a year" })).toBeNull()
    await expect(canvas.getByRole("button", { name: "June 2024" })).toHaveAttribute("data-selected")
    await userEvent.hover(canvas.getByRole("button", { name: "June 2024" }))
    await expect(await canvas.findByText("Hovering 2024-06-01")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Next year" })).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Previous year" })).toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Next decade" }))
    await expect(await canvas.findByText("30 – 39")).toBeVisible()
    await userEvent.hover(canvas.getByRole("button", { name: "2033" }))
    await expect(await canvas.findByText("Hovering 2033-01-01")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "2033" }))
    await expect(await canvas.findByRole("button", { name: "January 2033" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Later" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Earlier" })).toBeVisible()
    canvas.getByRole("button", { name: "January 2033" }).focus()
    await userEvent.keyboard("y")
    await expect(canvas.getByRole("button", { name: "January 2033" })).toBeVisible()
  }
}
