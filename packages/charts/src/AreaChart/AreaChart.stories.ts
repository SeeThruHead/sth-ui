import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as TypesDemo from "./demos/types.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/AreaChart" }

export default meta

const plots = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>("[data-plot]"))

const yTicks = (plot: HTMLElement) =>
  Array.from(present(plot.parentElement).querySelectorAll("[data-y-tick]")).map((tick) => tick.textContent)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    const areas = Array.from(plot.querySelectorAll("path[fill^='url']"))
    await expect(areas).toHaveLength(3)
    await expect(present(areas[0]).getAttribute("d")).toMatch(/Z$/)
    const stops = Array.from(plot.querySelectorAll("stop")).map((stop) => getComputedStyle(stop).stopOpacity)
    await expect(stops.slice(0, 2)).toEqual(["0.2", "0.01"])
    await expect(present(plot.querySelector("[data-dot-index]")).getBoundingClientRect().width).toBe(8)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    const box = plot.getBoundingClientRect()
    const user = userEvent.setup()
    await user.pointer({ target: plot, coords: { clientX: box.left + 2, clientY: box.top + 40 } })
    const tooltip = await waitFor(() =>
      present(
        Array.from(plot.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).find(
          (item) => item.style.display === "block"
        )
      )
    )
    await expect(within(tooltip).getByText("Mar 22")).toBeVisible()
    const active = present(plot.querySelector("[data-active]"))
    await expect(active.getBoundingClientRect().width).toBe(10)
    await expect(getComputedStyle(active).backgroundColor).toBe("rgb(255, 255, 255)")
  }
}

export const Types: StoryObj = {
  render: demo(TypesDemo.view),
  play: async ({ canvasElement }) => {
    const [stacked, percent, gaps] = await waitFor(() => {
      const found = plots(canvasElement)
      return found.length === 3 ? found : Promise.reject(new Error("waiting"))
    })
    await expect(yTicks(present(stacked))).toEqual(["0", "2500", "5000", "7500", "10000"])
    await expect(yTicks(present(percent))).toEqual(["0%", "25%", "50%", "75%", "100%"])
    await expect(present(gaps).querySelectorAll("path[fill^='url']")).toHaveLength(2)
    await expect(present(gaps).querySelectorAll("stop")).toHaveLength(1)
    await expect(yTicks(present(gaps))).toEqual(["-70", "0", "70", "140", "210"])
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
