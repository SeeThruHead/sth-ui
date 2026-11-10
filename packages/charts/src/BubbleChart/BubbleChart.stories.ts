import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/BubbleChart" }

export default meta

const bubbles = (root: Element) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<HTMLElement>("[data-segment]"))
    return found.length > 0 ? found : Promise.reject(new Error("waiting"))
  })

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const found = await bubbles(canvasElement)
    await expect(found).toHaveLength(8)
    const sizes = found.map((bubble) => Math.round(bubble.getBoundingClientRect().width))
    await expect(Math.max(...sizes)).toBe(17)
    await expect(Math.min(...sizes)).toBe(5)
    await expect(getComputedStyle(present(found[0])).backgroundColor).toBe("rgb(130, 201, 30)")
    await expect(within(canvasElement).getByText("Sales/hour")).toBeVisible()
    await expect(within(canvasElement).getAllByText("22:00")[0]).toBeVisible()
    await userEvent.hover(present(found[3]))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(present(shown(canvasElement)[0])).toHaveTextContent("14:00210")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const found = await bubbles(canvasElement)
    await expect(found).toHaveLength(3)
    await expect(canvasElement.querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
    await expect(getComputedStyle(within(canvasElement).getByText("Mon")).color).toBe("rgb(28, 126, 214)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await bubbles(canvasElement)).toHaveLength(8)
  }
}
