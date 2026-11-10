import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/MatrixChart" }

export default meta

const svgs = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<SVGSVGElement>("svg"))
    return found.length === count ? found : Promise.reject(new Error("waiting"))
  })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await within(canvasElement).findByRole("img", {
      name: "Heatmap, 7 columns by 6 rows, values from 0 to 16"
    })
    await expect(chart.querySelectorAll("rect")).toHaveLength(42)
    await expect(chart.getAttribute("width")).toBe(String(60 + 7 * 21 - 1))
    await expect(Array.from(chart.querySelectorAll("text")).map((text) => text.textContent)).toContain("Wed")
    await expect(chart.querySelector("text[transform]")).toBeNull()
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [full, sparse, empty] = (await svgs(canvasElement, 3)).map(present)
    await expect(present(full).querySelectorAll("text[transform]")).toHaveLength(7)
    await expect(present(full).querySelectorAll("[data-id='legend'] rect")).toHaveLength(5)
    await expect(present(full).querySelectorAll("rect[data-empty]")).toHaveLength(2)
    await expect(within(canvasElement).getByRole("img", { name: "Sales by region" })).toBe(sparse)
    const cells = Array.from(present(sparse).querySelectorAll<SVGRectElement>("rect")).slice(0, 6)
    await expect(cells.filter((cell) => getComputedStyle(cell).fill === "rgb(206, 212, 218)")).toHaveLength(4)
    await expect(present(sparse).querySelectorAll("[data-id='legend'] rect")).toHaveLength(4)
    await expect(present(empty)).not.toHaveAttribute("role")
    await userEvent.hover(present(present(full).querySelector("rect")))
    const tooltip = present(canvasElement.querySelector<HTMLElement>("[data-floating-label]"))
    await waitFor(() => expect(tooltip.style.display).toBe("block"))
    await expect(tooltip).toHaveTextContent("Mon 00:00: 0")
  }
}
