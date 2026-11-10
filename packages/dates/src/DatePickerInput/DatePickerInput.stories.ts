import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/DatePickerInput" }

export default meta

const page = within(document.body)

const hidden = (canvasElement: HTMLElement, name: string) =>
  present(canvasElement.querySelector<HTMLInputElement>(`input[name='${name}']`)).value

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Pick date" })).toHaveTextContent("May 14, 2024")
    await expect(canvas.getByRole("button", { name: "Pick date" })).toHaveAttribute("data-dates-input")
    await expect(hidden(canvasElement, "date")).toBe("2024-05-14")
    await expect(canvas.getByRole("button", { name: "Pick dates" })).toHaveTextContent("Pick dates")
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible()
    await expect(canvas.getByText("closeOnChange is off")).toBeVisible()
    const locked = canvas.getByRole("button", { name: "Read only" })
    await expect(locked).toHaveAttribute("data-read-only")
    await expect(getComputedStyle(locked).fontWeight).toBe("700")
    await expect(canvas.getAllByRole("button", { name: "Clear" })).toHaveLength(1)
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Pick date" }))
    await userEvent.click(await page.findByRole("button", { name: "20 May 2024" }))
    await waitFor(() => expect(page.queryByRole("button", { name: "20 May 2024" })).toBeNull())
    await expect(canvas.getByRole("button", { name: "Pick date" })).toHaveTextContent("May 20, 2024")
    await expect(hidden(canvasElement, "date")).toBe("2024-05-20")
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Pick date" })).toHaveTextContent("Pick date"))
    await expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Read only" }))
    await expect(page.queryByRole("button", { name: "3 May 2024" })).toBeNull()
  }
}

export const PickingSeveral: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Pick dates" }))
    await userEvent.click(await page.findByRole("button", { name: "7 May 2024" }))
    await userEvent.click(page.getByRole("button", { name: "2 May 2024" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Pick dates" })).toHaveTextContent("2 May, 7 May"))
    await expect(page.getByRole("button", { name: "2 May 2024" })).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("button", { name: "2 May 2024" })).toBeNull())
  }
}

export const PickingARange: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const range = await canvas.findByRole("button", { name: "Pick a range" })
    await userEvent.click(range)
    await userEvent.click(await page.findByRole("button", { name: "20 May 2024" }))
    await waitFor(() => expect(range).toHaveTextContent("May 20, 2024 to"))
    await expect(hidden(canvasElement, "range")).toBe("2024-05-20 –")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(range).toHaveTextContent("Pick dates range"))
    await userEvent.click(range)
    await userEvent.click(await page.findByRole("button", { name: "15 May 2024" }))
    await userEvent.click(page.getByRole("button", { name: "10 May 2024" }))
    await waitFor(() => expect(range).toHaveTextContent("May 10, 2024 to May 15, 2024"))
    await expect(hidden(canvasElement, "range")).toBe("2024-05-10 – 2024-05-15")
  }
}

export const StayingOpen: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Stays open" }))
    await userEvent.click(await page.findByRole("button", { name: "This month" }))
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Stays open" })).toHaveTextContent("2024-05-01 / 2024-05-09")
    )
    await waitFor(() => expect(page.getByRole("button", { name: "This month" })).toBeVisible())
  }
}
