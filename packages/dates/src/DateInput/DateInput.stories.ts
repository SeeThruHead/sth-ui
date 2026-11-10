import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configureApp, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/DateInput" }

export default meta

const page = within(document.body)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Clearable" })).toHaveValue("May 14, 2024")
    await expect(canvas.getByRole("textbox", { name: "Date input" })).toHaveAttribute("placeholder", "Date input")
    await expect(canvas.getByRole("textbox", { name: "Read only" })).toHaveAttribute("data-read-only")
    await expect(canvas.getAllByRole("button", { name: "Clear" })).toHaveLength(1)
    await expect(present(canvasElement.querySelector<HTMLInputElement>("input[name='clearable']")).value).toBe(
      "2024-05-14"
    )
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Date input" })
    await userEvent.type(input, "June 3, 2024")
    await expect(await canvas.findByText("Value: 2024-06-03")).toBeVisible()
    await expect(await page.findByText("June 2024")).toBeVisible()
    await userEvent.clear(input)
    await userEvent.type(input, "June 3, 2025")
    await expect(canvas.getByText("Value: 2024-06-03")).toBeVisible()
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue("June 3, 2024"))
    await expect(page.queryByText("June 2024")).toBeNull()
    const formatted = canvas.getByRole("textbox", { name: "Day first" })
    await expect(getComputedStyle(formatted).fontWeight).toBe("700")
    await userEvent.type(formatted, "09/03/2024")
    await expect(await canvas.findByText("Value: 2024-03-09")).toBeVisible()
    await userEvent.type(formatted, "x")
    await userEvent.tab()
    await expect(formatted).toHaveValue("09/03/2024x")
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("textbox", { name: "Clearable" })
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "20 May 2024" }))
    await waitFor(() => expect(input).toHaveValue("May 20, 2024"))
    await expect(input).toHaveFocus()
    await expect(page.queryByRole("button", { name: "20 May 2024" })).toBeNull()
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "20 May 2024" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "May Day" }))
    await waitFor(() => expect(input).toHaveValue("May 1, 2024"))
    await userEvent.click(input)
    await userEvent.keyboard("{Escape}")
    await expect(page.queryByRole("button", { name: "May Day" })).toBeNull()
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "None" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await userEvent.type(input, "2024-02-29")
    await expect(await canvas.findByText("Value: 2024-02-29")).toBeVisible()
    await userEvent.clear(input)
    await waitFor(() => expect(canvas.queryByText("Value: 2024-02-29")).toBeNull())
    await userEvent.type(input, "2024-02-28")
    await userEvent.click(await canvas.findByRole("button", { name: "Clear" }))
    await waitFor(() => expect(input).toHaveValue(""))
    await userEvent.type(input, "2024-02-28")
    await userEvent.click(await page.findByText("February 2024"))
    await waitFor(() => expect(page.getByRole("button", { name: "February 2024" })).toHaveAttribute("data-selected"))
    await userEvent.click(page.getByText("2024"))
    await waitFor(() => expect(page.getByRole("button", { name: "2024" })).toHaveAttribute("data-selected"))
    await userEvent.keyboard("{Escape}")
    await userEvent.click(canvas.getByRole("textbox", { name: "Read only" }))
    await expect(page.queryByRole("button", { name: "3 May 2024" })).toBeNull()
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
