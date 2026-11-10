import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/CandlestickChart" }

export default meta

const plotOf = (root: Element) => waitFor(() => present(root.querySelector<HTMLElement>("[data-plot]")))

const candles = (plot: HTMLElement) => Array.from(plot.querySelectorAll<HTMLElement>("[data-candle]"))

const yTicks = (plot: HTMLElement) =>
  Array.from(present(plot.parentElement).querySelectorAll("[data-y-tick]")).map((tick) => tick.textContent)

const shown = (plot: HTMLElement) =>
  present(
    Array.from(plot.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).find(
      (item) => item.style.display === "block"
    )
  )

const part = (candle: HTMLElement, name: string) => present(candle.querySelector<HTMLElement>(`[data-${name}]`))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    await expect(candles(plot)).toHaveLength(8)
    await expect(plot).toHaveAttribute("tabindex", "0")
    await expect(candles(plot).filter((candle) => candle.dataset["candle"] === "up")).toHaveLength(4)
    await expect(yTicks(plot)).toEqual(["185", "215", "245", "275", "295"])
    const first = present(candles(plot)[0])
    await expect(getComputedStyle(part(first, "body")).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(getComputedStyle(part(present(candles(plot)[1]), "wick")).backgroundColor).toBe("rgb(250, 82, 82)")
    const wick = part(first, "wick").getBoundingClientRect()
    const body = part(first, "body").getBoundingClientRect()
    await expect(wick.width).toBe(1)
    await expect(wick.top < body.top).toBe(true)
    await expect(
      Math.round((first.getBoundingClientRect().width / (plot.getBoundingClientRect().width / 8)) * 10)
    ).toBe(8)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    const box = plot.getBoundingClientRect()
    await userEvent
      .setup()
      .pointer({ target: plot, coords: { clientX: box.left + box.width * 0.07, clientY: box.top + 40 } })
    const tooltip = await waitFor(() => shown(plot))
    await expect(tooltip).toHaveTextContent("Mar 01Open200High240Low190Close230")
    await expect(tooltip.querySelector("svg")).toBeNull()
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await plotOf(canvasElement)
    await expect(candles(plot)).toHaveLength(4)
    await expect(plot).not.toHaveAttribute("tabindex")
    await expect(plot.querySelectorAll("[data-chart-tooltip]")).toHaveLength(4)
    const first = present(candles(plot)[0])
    await expect(first.getBoundingClientRect().width).toBe(16)
    await expect(getComputedStyle(part(first, "body")).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(part(present(candles(plot)[1]), "body")).backgroundColor).toBe("rgb(253, 126, 20)")
    await expect(part(first, "wick").getBoundingClientRect().width).toBe(2)
    await expect(within(canvasElement).getByText("Resistance")).toBeVisible()
    await expect(within(canvasElement).getByText("Price")).toBeVisible()
    await expect(present(plot.querySelector("[data-chart-tooltip]"))).toHaveTextContent(
      "MonOpened$12.40High$13.10Low$12.10Closed$12.90"
    )
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
