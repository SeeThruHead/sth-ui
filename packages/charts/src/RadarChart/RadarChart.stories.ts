import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as MultipleDemo from "./demos/multiple.ts"
import * as PlainDemo from "./demos/plain.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/RadarChart" }

export default meta

const chart = (root: Element) => waitFor(() => present(root.querySelector<SVGSVGElement>("svg[role='img']")))

const texts = (svg: SVGSVGElement) => Array.from(svg.querySelectorAll("text")).map((text) => text.textContent)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const svg = await chart(canvasElement)
    await expect(Math.round(present(svg.parentElement?.parentElement).getBoundingClientRect().height)).toBe(300)
    await expect(texts(svg)).toEqual(expect.arrayContaining(["Apples", "Lemons", "0", "120"]))
    const radar = present(svg.querySelector("[data-series='0']"))
    await expect(getComputedStyle(radar).fillOpacity).toBe("0.2")
    await expect(svg.querySelectorAll("path")).toHaveLength(5)
    await expect(svg.querySelectorAll("line")).toHaveLength(7)
    await expect(canvasElement.querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
  }
}

export const Multiple: StoryObj = {
  render: demo(MultipleDemo.view),
  play: async ({ canvasElement }) => {
    const svg = await chart(canvasElement)
    await expect(svg.querySelectorAll("circle")).toHaveLength(12)
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='bottom']"))
    await expect(within(legend).getByText("February")).toBeVisible()
    await userEvent.hover(within(legend).getByText("February"))
    await waitFor(() =>
      expect(getComputedStyle(present(svg.querySelector("path[data-series='0']"))).fillOpacity).toBe("0.05")
    )
  }
}

export const Hovering: StoryObj = {
  render: demo(MultipleDemo.view),
  play: async ({ canvasElement }) => {
    const svg = await chart(canvasElement)
    const box = svg.getBoundingClientRect()
    const user = userEvent.setup()
    await user.pointer({ target: svg, coords: { clientX: box.left + box.width / 2 + 2, clientY: box.top + 10 } })
    const root = present(svg.parentElement?.parentElement)
    const tooltip = await waitFor(() =>
      present(
        Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).find(
          (item) => item.style.display === "block"
        )
      )
    )
    await expect(within(tooltip).getByText("Apples")).toBeVisible()
    await expect(within(tooltip).getByText("120")).toBeVisible()
    await expect(
      Array.from(svg.querySelectorAll<SVGElement>("[data-radar-cursor]")).filter(
        (line) => line.style.display === "inline"
      )
    ).toHaveLength(1)
    await user.pointer({ target: document.body, coords: { clientX: 1, clientY: 1 } })
    await waitFor(() => expect(tooltip.style.display).toBe("none"))
  }
}

export const Plain: StoryObj = {
  render: demo(PlainDemo.view),
  play: async ({ canvasElement }) => {
    const svg = await chart(canvasElement)
    await expect(svg.querySelectorAll("text")).toHaveLength(0)
    await expect(svg.querySelectorAll("path")).toHaveLength(2)
    await expect(getComputedStyle(present(svg.querySelector("path"))).fillOpacity).toBe("0.4")
  }
}

export const Keyboard: StoryObj = {
  render: demo(PlainDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => present(canvasElement.querySelector("svg")))
    await userEvent.tab()
    const shownTooltip = () =>
      present(
        Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).find(
          (tooltip) => tooltip.style.display === "block"
        )
      )
    await waitFor(() => expect(within(shownTooltip()).getByText("Speed")).toBeVisible())
    await userEvent.keyboard("{ArrowRight}")
    await expect(within(shownTooltip()).getByText("Power")).toBeVisible()
    await userEvent.keyboard("{Enter}")
    await expect(
      Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
        (tooltip) => tooltip.style.display === "block"
      )
    ).toHaveLength(0)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await chart(canvasElement)).toBeVisible()
  }
}
