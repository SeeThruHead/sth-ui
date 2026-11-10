import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/WaffleChart" }

export default meta

const grids = (root: Element, count: number) =>
  waitFor(() => {
    const found = Array.from(root.querySelectorAll<SVGSVGElement>("svg"))
    return found.length === count ? found : Promise.reject(new Error("waiting"))
  })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const chart = await within(canvasElement).findByRole("img", {
      name: "Completed: 68, In progress: 22, Failed: 10 of 100"
    })
    await expect(chart.querySelectorAll("rect")).toHaveLength(100)
    await expect(chart.getAttribute("width")).toBe("218")
    await expect(chart.querySelectorAll("rect[data-series='0']")).toHaveLength(68)
    await expect(getComputedStyle(present(chart.querySelector("rect"))).fill).toBe("rgb(18, 184, 134)")
    await userEvent.hover(within(canvasElement).getByText("Failed"))
    await waitFor(() => expect(chart.querySelectorAll("rect[data-dimmed]")).toHaveLength(90))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [totalled, sized, reversed, empty] = (await grids(canvasElement, 4)).map(present)
    await expect(present(totalled).querySelectorAll("rect[data-empty]")).toHaveLength(30)
    await expect(present(sized).getAttribute("width")).toBe("120")
    await expect(present(reversed).querySelector("rect")?.getAttribute("x")).toBe("180")
    await expect(within(canvasElement).getByRole("group", { name: "Build results" })).toBeVisible()
    await expect(present(empty)).not.toHaveAttribute("role")
    await expect(present(empty).querySelectorAll("rect[data-empty]")).toHaveLength(9)
  }
}

export const Hovering: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const [totalled] = (await grids(canvasElement, 4)).map(present)
    await userEvent.hover(present(present(totalled).querySelector("rect[data-series='1']")))
    const tooltip = present(canvasElement.querySelector<HTMLElement>("[data-floating-label]"))
    await waitFor(() => expect(tooltip.style.display).toBe("block"))
    await expect(tooltip).toHaveTextContent("In progress: 13 cells")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
