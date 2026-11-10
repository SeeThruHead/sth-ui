import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as TypesDemo from "./demos/types.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/BarChart" }

export default meta

const plots = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>("[data-plot]"))

const bars = (plot: HTMLElement) => Array.from(plot.querySelectorAll<HTMLElement>("[data-series]"))

const yTicks = (plot: HTMLElement) =>
  Array.from(present(plot.parentElement).querySelectorAll("[data-y-tick]")).map((tick) => tick.textContent)

const shown = (plot: HTMLElement) =>
  present(
    Array.from(plot.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).find(
      (item) => item.style.display === "block"
    )
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    await expect(bars(plot)).toHaveLength(18)
    await expect(yTicks(plot)).toEqual(["0", "500", "1000", "1500", "2000"])
    const [first, second] = bars(plot).map((bar) => bar.getBoundingClientRect())
    await expect(Math.round(present(second).left - present(first).right)).toBe(4)
    await expect(getComputedStyle(present(bars(plot)[0])).backgroundColor).toBe("rgb(121, 80, 242)")
    const label = present(
      present(plot.parentElement).querySelector<HTMLElement>("[data-x-tick]")
    ).getBoundingClientRect()
    const group = present(present(bars(plot)[0]).parentElement?.parentElement).getBoundingClientRect()
    await expect(Math.abs(label.left + label.width / 2 - (group.left + group.width / 2))).toBeLessThan(1)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    const box = plot.getBoundingClientRect()
    const user = userEvent.setup()
    await user.pointer({ target: plot, coords: { clientX: box.left + box.width * 0.2, clientY: box.top + 40 } })
    const cursor = present(plot.querySelector<HTMLElement>("[data-cursor]"))
    await waitFor(() => expect(cursor.style.display).toBe("block"))
    await expect(Number.parseFloat(cursor.style.left)).toBeCloseTo(100 / 6)
    await expect(getComputedStyle(cursor).backgroundColor).toBe("rgba(173, 181, 189, 0.15)")
    await expect(within(shown(plot)).getByText("February")).toBeVisible()
    await expect(within(shown(plot)).getByText("1900")).toBeVisible()
  }
}

export const Types: StoryObj = {
  render: demo(TypesDemo.view),
  play: async ({ canvasElement }) => {
    const found = await waitFor(() => {
      const all = plots(canvasElement)
      return all.length === 3 ? all : Promise.reject(new Error("waiting"))
    })
    const [stacked, percent, changes] = found.map(present)
    await expect(yTicks(present(stacked))).toEqual(["0", "900", "1800", "2700", "3600"])
    await expect(yTicks(present(percent))).toEqual(["0%", "25%", "50%", "75%", "100%"])
    await expect(bars(present(changes)).map((bar) => Math.round(bar.getBoundingClientRect().width))).toEqual([
      30, 30, 30, 30
    ])
    await expect(getComputedStyle(present(bars(present(changes))[0])).opacity).toBe("0.6")
    await expect(yTicks(present(changes))).toContain("$-150")
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='top']"))
    await userEvent.hover(within(legend).getByText("Laptops"))
    await waitFor(() =>
      expect(bars(present(stacked)).filter((bar) => bar.hasAttribute("data-dimmed"))).toHaveLength(12)
    )
  }
}

export const Keyboard: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    await userEvent.tab()
    await expect(plot).toHaveFocus()
    await waitFor(() => expect(within(shown(plot)).getByText("January")).toBeVisible())
    await userEvent.keyboard("{ArrowRight}")
    await expect(within(shown(plot)).getByText("February")).toBeVisible()
    const cursor = present(plot.querySelector<HTMLElement>("[data-cursor]"))
    await expect(Number.parseFloat(cursor.style.left)).toBeCloseTo(100 / 6)
    await userEvent.keyboard("{Enter}")
    await expect(cursor.style.display).toBe("none")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
