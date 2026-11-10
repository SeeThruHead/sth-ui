import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/Heatmap" }

export default meta

const svgs = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<SVGSVGElement>("svg"))
    return found.length === count ? found : Promise.reject(new Error("waiting"))
  })

const texts = (svg: SVGSVGElement | undefined) =>
  Array.from(present(svg).querySelectorAll("text")).map((text) => text.textContent)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const [svg] = await svgs(canvasElement, 1)
    const chart = present(svg)
    await expect(chart.querySelectorAll("rect")).toHaveLength(371)
    await expect(chart.getAttribute("width")).toBe("584")
    await expect(chart.getAttribute("height")).toBe("78")
    const empty = present(chart.querySelector("rect[data-empty]"))
    await expect(getComputedStyle(empty).fill).toBe("rgb(233, 236, 239)")
    const full = present(chart.querySelector<SVGRectElement>("rect[data-date='2024-02-16']"))
    await expect(full.style.fill).toMatch(/var\(/)
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [labelled, split, plain] = await svgs(canvasElement, 3)
    await expect(texts(labelled)).toEqual(expect.arrayContaining(["Mon", "Wed", "Mar", "Less", "More"]))
    await expect(present(labelled).querySelectorAll("[data-id='legend'] rect")).toHaveLength(5)
    await expect(texts(split).slice(0, 3)).toEqual(["Sun", "Mon", ""])
    await expect(texts(split)).toContain("Jun")
    await expect(present(split).querySelector("rect[data-date='2023-12-31']")).toBeNull()
    await expect(present(present(split).querySelector("rect")).getAttribute("width")).toBe("14")
    await expect(present(plain).querySelectorAll("rect").length).toBeGreaterThan(360)
  }
}

export const Hovering: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [labelled] = await svgs(canvasElement, 3)
    const day = present(present(labelled).querySelector<SVGRectElement>("rect[data-date='2024-03-05']"))
    await userEvent.hover(day)
    const tooltip = present(canvasElement.querySelector<HTMLElement>("[data-floating-label]"))
    await waitFor(() => expect(tooltip.style.display).toBe("block"))
    await expect(tooltip).toHaveTextContent(/^2024-03-05 – .* contributions$/)
    await userEvent.hover(present(labelled))
    await userEvent.unhover(present(labelled))
    await waitFor(() => expect(tooltip.style.display).toBe("none"))
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
