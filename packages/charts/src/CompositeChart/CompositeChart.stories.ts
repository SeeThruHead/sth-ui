import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as GapsDemo from "./demos/gaps.ts"
import * as LinesDemo from "./demos/lines.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/CompositeChart" }

export default meta

const plot = (root: Element) => waitFor(() => present(root.querySelector<HTMLElement>("[data-plot]")))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const area = await plot(canvasElement)
    await expect(area).toHaveAttribute("data-band")
    const bars = Array.from(area.querySelectorAll<HTMLElement>("div[data-series='0']"))
    await expect(bars).toHaveLength(5)
    await expect(Math.round(present(bars[0]).getBoundingClientRect().width)).toBe(30)
    const paths = Array.from(area.querySelectorAll("path"))
    await expect(paths).toHaveLength(2)
    await expect(getComputedStyle(present(paths[1])).fillOpacity).toBe("0.2")
    const dots = Array.from(area.querySelectorAll<HTMLElement>("[data-dot-index='0']"))
    const bar = present(bars[0]).getBoundingClientRect()
    await expect(
      Math.abs(present(dots[0]).getBoundingClientRect().left + 3.5 - (bar.left + bar.width / 2))
    ).toBeLessThan(1)
  }
}

export const Lines: StoryObj = {
  render: demo(LinesDemo.view),
  play: async ({ canvasElement }) => {
    const area = await plot(canvasElement)
    await expect(area).not.toHaveAttribute("data-band")
    await expect(present(area.querySelector("path"))).toHaveAttribute("stroke-dasharray", "5 5")
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='top']"))
    await userEvent.hover(within(legend).getByText("Oranges"))
    await waitFor(() =>
      expect(
        Array.from(area.querySelectorAll("[data-dimmed]")).every((item) => item.getAttribute("data-series") === "0")
      ).toBe(true)
    )
    await expect(area.querySelectorAll("span[data-dimmed]")).toHaveLength(5)
  }
}

export const Gaps: StoryObj = {
  render: demo(GapsDemo.view),
  play: async ({ canvasElement }) => {
    const area = await plot(canvasElement)
    const bars = Array.from(area.querySelectorAll<HTMLElement>("div[data-series='0']"))
    await expect(bars.map((bar) => Math.round(bar.getBoundingClientRect().height))).toContain(0)
    await expect(area.querySelectorAll("path")).toHaveLength(2)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
