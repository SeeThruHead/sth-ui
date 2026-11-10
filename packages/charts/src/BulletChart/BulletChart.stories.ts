import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/BulletChart" }

export default meta

const tracks = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(
      root.querySelectorAll<HTMLElement>("[data-orientation] > [data-orientation]:not(:has(> [data-orientation]))")
    )
    return found.length >= count ? found : Promise.reject(new Error("waiting"))
  })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Revenue")).toBeVisible()
    await expect(canvas.getByText("270")).toBeVisible()
    await expect(canvas.getByText("250")).toBeVisible()
    const [track] = await tracks(canvasElement, 1)
    const bands = Array.from(present(track).children).map((child) => child.getBoundingClientRect())
    await expect(present(track).getBoundingClientRect().height).toBe(32)
    await expect(Math.round(present(bands[3]).height)).toBe(16)
    await expect(Math.round((present(bands[3]).width / present(track).getBoundingClientRect().width) * 100)).toBe(90)
    await expect(Math.round(present(bands[4]).height)).toBe(22)
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("$180")).toBeVisible()
    await expect(canvas.getByText("$400")).toBeVisible()
    await expect(canvas.getByText("Vertical")).toBeVisible()
    const all = await tracks(canvasElement, 4)
    const vertical = present(all.find((track) => track.getAttribute("data-orientation") === "vertical"))
    await expect(vertical.getBoundingClientRect().width).toBe(32)
    await userEvent.hover(present(canvas.getByText("$180").parentElement))
    const tooltip = present(canvasElement.querySelector<HTMLElement>("[data-floating-label]"))
    await waitFor(() => expect(tooltip.style.display).toBe("block"))
    await expect(tooltip).toHaveTextContent("Value: $180 / Target: $400")
    await expect(canvas.getAllByText("120")).toHaveLength(1)
  }
}
