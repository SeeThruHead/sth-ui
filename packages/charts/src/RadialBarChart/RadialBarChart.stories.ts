import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/RadialBarChart" }

export default meta

const svgs = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<SVGSVGElement>("svg[role='img']"))
    return found.length === count ? found : Promise.reject(new Error("waiting"))
  })

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const svg = present((await svgs(canvasElement, 1))[0])
    await expect(svg.querySelectorAll("[data-segment]")).toHaveLength(7)
    await expect(svg.querySelectorAll("path")).toHaveLength(14)
    await expect(getComputedStyle(present(svg.querySelector("path"))).fill).toBe("rgb(241, 243, 245)")
    await userEvent.hover(present(svg.querySelector("[data-segment='0']")))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(within(present(shown(canvasElement)[0])).getByText("31.47")).toBeVisible()
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='bottom']"))
    await userEvent.hover(within(legend).getByText("50+"))
    await waitFor(() => expect(svg.querySelectorAll("[data-dimmed]")).toHaveLength(6))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [half, plain] = (await svgs(canvasElement, 2)).map(present)
    await expect(present(half).querySelectorAll("text")).toHaveLength(7)
    await expect(present(plain).querySelectorAll("path")).toHaveLength(3)
    await expect(present(plain?.parentElement?.parentElement).querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(present((await svgs(canvasElement, 1))[0]).querySelectorAll("[data-segment]")).toHaveLength(7)
  }
}
