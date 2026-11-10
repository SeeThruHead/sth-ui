import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/SankeyChart" }

export default meta

const nodes = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>("[data-segment^='node-']"))

const links = (root: Element) => Array.from(root.querySelectorAll<SVGPathElement>("path[data-segment^='link-']"))

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

const charts = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-segment='node-0']")).map((node) =>
    present(node.parentElement?.parentElement)
  )

const labelOf = (root: Element, name: string) =>
  present(
    Array.from(root.querySelectorAll<HTMLElement>("span")).find(
      (span) => span.firstChild?.textContent?.trim() === name && span.closest("[data-chart-tooltip]") === null
    )
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(nodes(canvasElement)).toHaveLength(8))
    await expect(links(canvasElement)).toHaveLength(8)
    const [coal, gas] = nodes(canvasElement).map(present)
    await expect(getComputedStyle(present(coal)).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(present(gas)).backgroundColor).toBe("rgb(21, 170, 191)")
    await expect(present(coal).getBoundingClientRect().width).toBe(10)
    const link = present(links(canvasElement)[0])
    await expect(getComputedStyle(link).fill).toBe("rgb(206, 212, 218)")
    await expect(getComputedStyle(link).opacity).toBe("0.4")
    const loss = present(nodes(canvasElement)[7]).getBoundingClientRect()
    await expect(Math.round(loss.right)).toBe(
      Math.round(present(present(coal).parentElement).getBoundingClientRect().right)
    )
    await expect(Math.round(labelOf(canvasElement, "Loss").getBoundingClientRect().right)).toBe(
      Math.round(loss.left - 6)
    )
    await expect(Math.round(labelOf(canvasElement, "Coal").getBoundingClientRect().left)).toBe(
      Math.round(present(coal).getBoundingClientRect().right + 6)
    )
    await expect(labelOf(canvasElement, "Wind")).toHaveTextContent("Wind 2")
    await expect(labelOf(canvasElement, "Coal").children).toHaveLength(2)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(nodes(canvasElement)).toHaveLength(8))
    await userEvent.hover(present(nodes(canvasElement)[0]))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(present(shown(canvasElement)[0])).toHaveTextContent("Coal40")
    await userEvent.hover(present(links(canvasElement)[0]))
    await waitFor(() => expect(present(shown(canvasElement)[0])).toHaveTextContent("Coal - Grid40"))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(nodes(canvasElement)).toHaveLength(12))
    const [colored, plain] = charts(canvasElement)
    const salary = present(nodes(present(colored))[0])
    await expect(getComputedStyle(salary).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(salary.getBoundingClientRect().width).toBe(16)
    await expect(getComputedStyle(present(nodes(present(colored))[2])).backgroundColor).toBe("rgb(253, 126, 20)")
    await expect(getComputedStyle(present(nodes(present(colored))[3])).backgroundColor).toBe("rgb(76, 110, 245)")
    await expect(getComputedStyle(present(links(present(colored))[0])).fill).toBe("rgb(18, 184, 134)")
    await expect(getComputedStyle(present(links(present(colored))[2])).fill).toBe("rgb(165, 216, 255)")
    await expect(getComputedStyle(present(links(present(colored))[2])).opacity).toBe("0.6")
    await expect(within(present(colored)).getAllByText("$4800").length).toBeGreaterThan(0)
    await expect(present(colored).querySelectorAll("[data-chart-tooltip]")).toHaveLength(11)
    await expect(getComputedStyle(present(nodes(present(plain))[2])).backgroundColor).toBe("rgb(134, 142, 150)")
    await expect(present(plain).querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
  }
}
