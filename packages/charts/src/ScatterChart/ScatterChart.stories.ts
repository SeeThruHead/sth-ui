import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/ScatterChart" }

export default meta

const plotOf = (root: Element) => waitFor(() => present(root.querySelector<HTMLElement>("[data-plot]")))

const ticks = (plot: HTMLElement, axis: "x" | "y") =>
  Array.from(present(plot.parentElement).querySelectorAll(`[data-${axis}-tick]`)).map((tick) => tick.textContent)

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    await expect(plot.querySelectorAll("[data-segment]")).toHaveLength(30)
    await expect(ticks(plot, "x")).toEqual(["0", "15", "30", "45", "60"])
    await expect(ticks(plot, "y")).toEqual(["0", "9", "18", "27", "36"])
    await expect(within(canvasElement).getByText("Age")).toBeVisible()
    const point = present(plot.querySelector<HTMLElement>("[data-segment='0']"))
    await expect(point.getBoundingClientRect().width).toBe(9)
    await userEvent.hover(point)
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    const tooltip = present(shown(canvasElement)[0])
    await expect(within(tooltip).getByText("25")).toBeVisible()
    await expect(within(tooltip).getByText("BMI")).toBeVisible()
    await expect(tooltip.querySelector("svg")).toBeNull()
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    await expect(plot.querySelectorAll("[data-segment]")).toHaveLength(5)
    await expect(ticks(plot, "y")).toContain("100 kg")
    await expect(ticks(plot, "x")).toContain("30 y")
    await userEvent.hover(present(plot.querySelector<HTMLElement>("[data-segment='0']")))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    const tooltip = present(shown(canvasElement)[0])
    await expect(within(tooltip).getByText("Ann")).toBeVisible()
    await expect(within(tooltip).getByText("62 kg")).toBeVisible()
    await expect(within(tooltip).getByText("Weight")).toBeVisible()
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='top']"))
    await userEvent.hover(within(legend).getByText("Group 2"))
    await waitFor(() => expect(plot.querySelectorAll("[data-dimmed]")).toHaveLength(2))
  }
}

export const Plain: StoryObj = {
  render: demo(PlainDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    await expect(ticks(plot, "x")).toContain("15.0")
    await expect(plot.querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
    await expect(plot.querySelectorAll("line")).toHaveLength(10)
  }
}
