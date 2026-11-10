import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, waitFor } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as CurvesDemo from "./demos/curves.ts"
import * as TrendDemo from "./demos/trend.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/Sparkline" }

export default meta

const paths = (root: Element) => Array.from(root.querySelectorAll("path"))

const rounded = (path: string | null | undefined) =>
  (path ?? "").replace(/\d+\.\d+/g, (number) => String(Math.round(Number(number) * 100) / 100))

const stroke = (path: Element | undefined) => getComputedStyle(present(path)).stroke

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const svg = await waitFor(() => present(canvasElement.querySelector("svg")))
    const root = present(svg.parentElement?.parentElement)
    await expect(root.getBoundingClientRect().width).toBe(200)
    await expect(root.getBoundingClientRect().height).toBe(60)
    await expect(svg.getBoundingClientRect().height).toBe(50)
    const [area, line] = paths(svg)
    await expect(rounded(line?.getAttribute("d"))).toBe(
      "M0,83.33L16.67,66.67L33.33,33.33L50,66.67L66.67,33.33L83.33,83.33L100,16.67"
    )
    await expect(stroke(line)).toBe("rgb(34, 139, 230)")
    await expect(line).toHaveAttribute("stroke-width", "2")
    await expect(area).toHaveAttribute("fill", expect.stringMatching(/^url\(#sparkline-/))
    const stops = Array.from(svg.querySelectorAll("stop"))
    await expect(stops.map((stop) => getComputedStyle(stop).stopOpacity)).toEqual(["0.6", "0.01"])
  }
}

export const Trend: StoryObj = {
  render: demo(TrendDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll("svg")).toHaveLength(3))
    const lines = Array.from(canvasElement.querySelectorAll("svg")).map((svg) => paths(svg)[1])
    await expect(lines.map(stroke)).toEqual(["rgb(18, 184, 134)", "rgb(250, 82, 82)", "rgb(173, 181, 189)"])
  }
}

export const Curves: StoryObj = {
  render: demo(CurvesDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll("svg")).toHaveLength(8))
    const svgs = Array.from(canvasElement.querySelectorAll("svg"))
    await expect(paths(present(svgs[1]))[1]?.getAttribute("d")).toContain("C")
    const gaps = paths(present(svgs[7]))
    await expect(gaps).toHaveLength(6)
    await expect(stroke(gaps[3])).toBe("rgb(190, 75, 219)")
    await expect(present(svgs[7]).querySelectorAll("stop")).toHaveLength(1)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
