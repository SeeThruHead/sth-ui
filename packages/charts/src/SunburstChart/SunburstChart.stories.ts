import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/SunburstChart" }

export default meta

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

const sectors = async (root: HTMLElement, count: number) => {
  await waitFor(() => expect(root.querySelectorAll("path[data-segment]").length).toBe(count))

  return Array.from(root.querySelectorAll<SVGPathElement>("path[data-segment]"))
}

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const paths = await sectors(canvasElement, 8)
    await expect(present(canvasElement.querySelector("svg")).getAttribute("width")).toBe("300")
    await expect(getComputedStyle(present(paths[1])).fill).toBe("rgb(255, 135, 135)")
    await expect(getComputedStyle(present(paths[2])).fill).toBe("rgb(250, 82, 82)")
    await expect(present(paths[6])).toHaveAttribute("data-depth", "3")
    await expect(canvasElement.querySelectorAll("svg text")).toHaveLength(0)
    await userEvent.hover(present(paths[1]))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(present(shown(canvasElement)[0])).toHaveTextContent("Apples30")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const paths = await sectors(canvasElement, 12)
    const [labelled, half] = Array.from(canvasElement.querySelectorAll("svg"))
    await expect(present(labelled).getAttribute("width")).toBe("240")
    await expect(Array.from(present(labelled).querySelectorAll("text")).map((text) => text.textContent)).toContain(
      "Apples"
    )
    await expect(present(paths[0])).toHaveAttribute("stroke-width", "2")
    await expect(getComputedStyle(present(paths[0])).stroke).toBe("rgb(46, 46, 46)")
    await expect(getComputedStyle(present(paths[8])).fill).toBe("rgb(51, 51, 51)")
    await expect(present(present(half).parentElement).querySelectorAll("[data-chart-tooltip]")).toHaveLength(4)
    await expect(present(present(labelled).parentElement).querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
    await expect(present(present(half).parentElement).querySelector("[data-chart-tooltip]")).toHaveTextContent("Mon8 h")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
