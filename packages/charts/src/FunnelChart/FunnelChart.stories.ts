import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/FunnelChart" }

export default meta

const charts = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<SVGSVGElement>("svg[role='img']"))
    return found.length === count ? found : Promise.reject(new Error("waiting"))
  })

const anchors = (svg: SVGSVGElement | undefined) =>
  Array.from(present(svg).querySelectorAll("text")).map((text) => text.getAttribute("text-anchor"))

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const [svg] = await charts(canvasElement, 1)
    const chart = present(svg)
    await expect(chart.getBoundingClientRect().width).toBe(300)
    const segments = Array.from(chart.querySelectorAll("[data-segment]"))
    await expect(segments).toHaveLength(4)
    await expect(present(segments[0]).getAttribute("d")).toBe("M5,5L295,5L258.75,77.5L41.25,77.5Z")
    await expect(getComputedStyle(present(segments[0])).fill).toBe("rgb(76, 110, 245)")
    await userEvent.hover(present(segments[1]))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(within(present(shown(canvasElement)[0])).getByText("Japan")).toBeVisible()
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [right, inside, left, legendChart, plain] = (await charts(canvasElement, 5)).map(present)
    await expect(anchors(right)).toEqual(["start", "start", "start", "start"])
    await expect(anchors(inside)).toEqual(["middle", "middle", "middle", "middle"])
    await expect(getComputedStyle(present(present(inside).querySelector("text"))).fill).toBe("rgb(255, 255, 255)")
    await expect(Array.from(present(left).querySelectorAll("text")).map((text) => text.textContent)).toContain(
      "400 users"
    )
    await expect(present(plain?.parentElement).querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
    const legend = present(present(legendChart?.parentElement).querySelector<HTMLElement>("[data-position='bottom']"))
    await userEvent.hover(within(legend).getByText("India"))
    await waitFor(() => expect(Array.from(present(legendChart).querySelectorAll("[data-dimmed]"))).toHaveLength(3))
    await userEvent.hover(present(present(legendChart).querySelector("[data-segment='2']")))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(within(present(shown(canvasElement)[0])).queryByText("USA")).toBeNull()
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect((await charts(canvasElement, 1)).length).toBe(1)
  }
}
