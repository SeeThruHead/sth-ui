import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/PieChart" }

export default meta

const segments = (root: Element) => Array.from(root.querySelectorAll<SVGPathElement>("[data-segment]"))

const visibleTooltips = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await waitFor(() => present(canvasElement.querySelector("svg")))
    await expect(chart.getBoundingClientRect().width).toBe(160)
    await expect(segments(chart)).toHaveLength(4)
    await expect(present(segments(chart)[0]).getAttribute("d")).toContain("L80,80Z")
    await expect(canvasElement.querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const charts = await waitFor(() => {
      const found = Array.from(canvasElement.querySelectorAll("svg[role='img']"))
      return found.length === 5 ? found : Promise.reject(new Error("waiting"))
    })
    const inside = present(charts[1])
    await expect(inside.getBoundingClientRect().width).toBe(200)
    await expect(Array.from(inside.querySelectorAll("text")).map((text) => text.textContent)).toContain("40%")
    await expect(present(charts[0]).querySelectorAll("text")).toHaveLength(4)
  }
}

export const Hovering: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await waitFor(() => present(canvasElement.querySelectorAll("svg[role='img']")[2]))
    await userEvent.hover(present(segments(chart)[1]))
    await waitFor(() => expect(visibleTooltips(canvasElement)).toHaveLength(1))
    await expect(present(visibleTooltips(canvasElement)[0])).toHaveTextContent("India300")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(present(canvasElement.querySelector("svg"))).toBeVisible())
  }
}
