import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/DonutChart" }

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
    const paths = segments(chart)
    await expect(paths).toHaveLength(4)
    await expect(paths.map((path) => getComputedStyle(path).fill)).toEqual([
      "rgb(76, 110, 245)",
      "rgb(250, 176, 5)",
      "rgb(18, 184, 134)",
      "rgb(134, 142, 150)"
    ])
    await expect(getComputedStyle(present(paths[0])).stroke).toBe("rgb(255, 255, 255)")
    await expect(visibleTooltips(canvasElement)).toHaveLength(0)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await waitFor(() => present(canvasElement.querySelector("svg")))
    await userEvent.hover(present(segments(chart)[0]))
    await waitFor(() => expect(visibleTooltips(canvasElement)).toHaveLength(1))
    const tooltip = present(visibleTooltips(canvasElement)[0])
    await expect(within(tooltip).getByText("USA")).toBeVisible()
    await expect(within(tooltip).getByText("400")).toBeVisible()
    await expect(within(tooltip).getByText("Other")).toBeVisible()
    await userEvent.hover(present(segments(chart)[1]))
    await expect(visibleTooltips(canvasElement)).toHaveLength(1)
    await userEvent.unhover(present(segments(chart)[1]))
    await waitFor(() => expect(visibleTooltips(canvasElement)).toHaveLength(0))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Users by country")).toBeVisible()
    const labels = Array.from(canvasElement.querySelectorAll("svg text")).map((text) => text.textContent)
    await expect(labels.filter((text) => text === "400")).toHaveLength(1)
    await expect(labels).toContain("40%")
  }
}

export const Highlighting: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const legend = await waitFor(() => present(canvasElement.querySelector("[data-legend-index='1']")))
    const chart = present(legend.parentElement?.parentElement)
    await userEvent.hover(legend)
    await waitFor(() =>
      expect(segments(chart).map((path) => getComputedStyle(path).fillOpacity)).toEqual(["0.2", "1", "0.2", "0.2"])
    )
    await userEvent.hover(present(segments(chart)[2]))
    await waitFor(() => expect(visibleTooltips(chart)).toHaveLength(1))
    await expect(within(present(visibleTooltips(chart)[0])).getByText("100 users")).toBeVisible()
    await expect(within(present(visibleTooltips(chart)[0])).queryByText("USA")).toBeNull()
  }
}

export const Keyboard: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await waitFor(() => present(canvasElement.querySelector("svg")))
    const root = present(chart.parentElement)
    await userEvent.tab()
    await expect(root).toHaveFocus()
    await expect(getComputedStyle(root).outlineStyle).toBe("solid")
    await waitFor(() => expect(visibleTooltips(canvasElement)).toHaveLength(1))
    await userEvent.keyboard("{ArrowLeft}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}a")
    await expect(visibleTooltips(canvasElement)).toHaveLength(1)
    await userEvent.keyboard("{Enter}")
    await expect(visibleTooltips(canvasElement)).toHaveLength(0)
    await userEvent.keyboard("{Enter}")
    await expect(visibleTooltips(canvasElement)).toHaveLength(1)
    await userEvent.tab()
    await expect(visibleTooltips(canvasElement)).toHaveLength(0)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(present(canvasElement.querySelector("svg"))).toBeVisible())
  }
}
