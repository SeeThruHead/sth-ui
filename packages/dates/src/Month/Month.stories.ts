import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as PartsDemo from "./demos/parts.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/Month" }

export default meta

const day = (root: HTMLElement, date: string) => present(root.querySelector<HTMLElement>(`[data-date="${date}"]`))

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const table = await canvas.findByRole("table")
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["#", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])
    await expect(within(table).getAllByRole("row")).toHaveLength(6)
    await expect(Array.from(table.querySelectorAll("tbody td:first-child")).map((cell) => cell.textContent)).toEqual([
      "18",
      "19",
      "20",
      "21",
      "22"
    ])
    await expect(canvas.getByRole("button", { name: "14 May 2024" })).toHaveAttribute("data-selected")
    await expect(canvas.getByRole("button", { name: "14 May 2024" })).toHaveAttribute("tabindex", "0")
    await expect(canvas.getByRole("button", { name: "15 May 2024" })).toHaveAttribute("tabindex", "-1")
    await expect(day(canvasElement, "2024-05-09")).toHaveAttribute("data-today")
    await expect(getComputedStyle(day(canvasElement, "2024-05-09")).borderTopStyle).toBe("solid")
    await expect(day(canvasElement, "2024-05-11")).toHaveAttribute("data-weekend")
    await expect(getComputedStyle(day(canvasElement, "2024-05-11")).color).toBe("rgb(250, 82, 82)")
    await expect(day(canvasElement, "2024-04-29")).toHaveAttribute("data-outside")
    await expect(day(canvasElement, "2024-04-29").getBoundingClientRect().width).toBe(36)
    await expect(getComputedStyle(day(canvasElement, "2024-05-14")).backgroundColor).toBe("rgb(34, 139, 230)")
  }
}

export const Clicking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.hover(await canvas.findByRole("button", { name: "21 May 2024" }))
    await expect(await canvas.findByText("Picked 2024-05-14, hovering 2024-05-21")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "21 May 2024" }))
    await expect(await canvas.findByText(/Picked 2024-05-21/)).toBeVisible()
    await expect(canvas.getByRole("button", { name: "21 May 2024" })).toHaveAttribute("data-selected")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [limited, french, wide] = await within(canvasElement).findAllByRole("table")
    const limits = present(limited)
    await expect(within(limits).getByRole("button", { name: "4 May 2024" })).toBeDisabled()
    await expect(within(limits).getByRole("button", { name: "20 May 2024" })).toBeDisabled()
    await expect(within(limits).getByRole("button", { name: "22 May 2024" })).toBeDisabled()
    await expect(within(limits).getByRole("button", { name: "5 May 2024" })).toHaveAttribute("tabindex", "0")
    await expect(day(limits, "2024-05-13")).toHaveAttribute("data-first-in-range")
    await expect(day(limits, "2024-05-16")).toHaveAttribute("data-last-in-range")
    await expect(getComputedStyle(day(limits, "2024-05-14")).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(getComputedStyle(day(limits, "2024-04-29")).display).toBe("none")
    await expect(day(limits, "2024-05-05").getBoundingClientRect().width).toBe(30)
    const fr = present(french)
    await expect(
      within(fr)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."])
    await expect(within(fr).getAllByRole("row")).toHaveLength(7)
    await expect(day(fr, "2024-02-14").tagName).toBe("DIV")
    await expect(day(fr, "2024-02-14")).toHaveTextContent("♥")
    await expect(day(fr, "2024-02-14")).toHaveAttribute("aria-label", "Jour 2024-02-14")
    await expect(day(fr, "2024-02-16")).toHaveAttribute("data-weekend")
    await expect(within(present(wide)).queryAllByRole("columnheader")).toHaveLength(0)
    await expect(day(present(wide), "2024-06-03")).toHaveAttribute("data-full-width")
    await expect(day(present(wide), "2024-06-03")).toHaveAttribute("data-today")
  }
}

export const Parts: StoryObj = {
  render: demo(PartsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first, second] = await canvas.findAllByRole("button", { name: /^[12]$/ })
    await expect(present(first).getBoundingClientRect().width).toBe(36)
    await expect(present(second).getBoundingClientRect().width).toBe(54)
    await expect(
      Array.from(canvasElement.querySelectorAll("td"))
        .slice(0, 7)
        .map((cell) => cell.textContent)
    ).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])
    const [, styled, plain] = canvas.getAllByRole("table")
    await expect(within(present(styled)).getByRole("button", { name: "21 May 2024" })).toHaveAttribute("tabindex", "0")
    await expect(
      getComputedStyle(within(present(styled)).getByRole("button", { name: "21 May 2024" })).fontWeight
    ).toBe("700")
    await expect(getComputedStyle(present(within(present(styled)).getAllByRole("columnheader")[0])).color).toBe(
      "rgb(0, 128, 0)"
    )
    await expect(within(present(plain)).getByRole("button", { name: "30 May 2024" })).toHaveAttribute("tabindex", "0")
  }
}
