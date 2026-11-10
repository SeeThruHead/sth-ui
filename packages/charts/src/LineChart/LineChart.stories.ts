import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configure, demo } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/LineChart" }

export default meta

const plots = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>("[data-plot]"))

const shownTooltips = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    const root = present(plot.parentElement?.parentElement)
    await expect(root.getBoundingClientRect().height).toBe(300)
    await expect(plot.querySelectorAll("path")).toHaveLength(3)
    await expect(Array.from(root.querySelectorAll("[data-y-tick]")).map((tick) => tick.textContent)).toEqual([
      "0",
      "900",
      "1800",
      "2700",
      "3600"
    ])
    await expect(root.querySelectorAll("[data-x-tick]")).toHaveLength(5)
    const xTicks = Array.from(root.querySelectorAll<HTMLElement>("[data-x-tick]"))
    const row = present(xTicks[0]?.parentElement).getBoundingClientRect()
    await waitFor(() =>
      expect(present(xTicks.at(-1)).getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 0.5)
    )
    await expect(present(xTicks[0]).getBoundingClientRect().left).toBeGreaterThanOrEqual(row.left - 0.5)
    await expect(plot.querySelectorAll("[data-dot-index]")).toHaveLength(15)
    await expect(getComputedStyle(present(plot.querySelector("path"))).stroke).toBe("rgb(76, 110, 245)")
    await expect(plot.querySelectorAll("line")).toHaveLength(5)
  }
}

export const Hovering: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    const box = plot.getBoundingClientRect()
    const user = userEvent.setup()
    await user.pointer({ target: plot, coords: { clientX: box.left + box.width * 0.52, clientY: box.top + 50 } })
    await waitFor(() => expect(shownTooltips(plot)).toHaveLength(1))
    const tooltip = present(shownTooltips(plot)[0])
    await expect(within(tooltip).getByText("Mar 24")).toBeVisible()
    await expect(within(tooltip).getByText("3322")).toBeVisible()
    await expect(plot.querySelectorAll("[data-active]")).toHaveLength(3)
    await expect(present(plot.querySelector<HTMLElement>("[data-cursor]")).style.left).toBe("50%")
    await user.pointer({ target: plot, coords: { clientX: box.right - 2, clientY: box.top + 50 } })
    await waitFor(() => expect(within(present(shownTooltips(plot)[0])).getByText("Mar 26")).toBeVisible())
    await expect(present(shownTooltips(plot)[0]).getBoundingClientRect().right).toBeLessThanOrEqual(box.right)
    await user.pointer({ target: document.body, coords: { clientX: 1, clientY: 1 } })
    await waitFor(() => expect(shownTooltips(plot)).toHaveLength(0))
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Target")).toBeVisible()
    await expect(canvas.getByText("Date")).toBeVisible()
    await expect(canvas.getByText("Amount")).toBeVisible()
    await expect(canvas.getAllByText("3600 kg")).toHaveLength(1)
    const legend = present(canvasElement.querySelector<HTMLElement>("[data-position='top']"))
    await expect(within(legend).getByText("Tomatoes (dashed)")).toBeVisible()
    const [first, second, crowded, third] = plots(canvasElement)
    await expect(present(first).querySelectorAll("line")).toHaveLength(10)
    await expect(present(second).querySelectorAll("path")).toHaveLength(2)
    await expect(present(second).querySelectorAll("[data-dot-index]")).toHaveLength(0)
    await expect(present(third).querySelectorAll("[data-chart-tooltip]")).toHaveLength(0)
    const hourTicks = Array.from(present(present(crowded).parentElement).querySelectorAll<HTMLElement>("[data-x-tick]"))
    await waitFor(() =>
      expect(hourTicks.filter((tick) => tick.style.visibility === "hidden").length).toBeGreaterThan(10)
    )
    await expect(present(hourTicks[0]).style.visibility).toBe("visible")
    await expect(present(hourTicks.at(-1)).style.visibility).toBe("visible")
  }
}

export const Highlighting: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    const legend = await waitFor(() => present(canvasElement.querySelector<HTMLElement>("[data-position='top']")))
    await userEvent.hover(within(legend).getByText("Oranges"))
    const plot = present(plots(canvasElement)[0])
    await waitFor(() =>
      expect(Array.from(plot.querySelectorAll("path")).map((path) => getComputedStyle(path).strokeOpacity)).toEqual([
        "0.5",
        "1",
        "0.5"
      ])
    )
  }
}

export const Keyboard: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const plot = await waitFor(() => present(plots(canvasElement)[0]))
    await userEvent.tab()
    await expect(plot).toHaveFocus()
    await waitFor(() => expect(within(present(shownTooltips(plot)[0])).getByText("Mar 22")).toBeVisible())
    await userEvent.keyboard("{ArrowRight}")
    await expect(within(present(shownTooltips(plot)[0])).getByText("Mar 23")).toBeVisible()
    await expect(present(plot.querySelector<HTMLElement>("[data-cursor]")).style.left).toBe(
      `${(1 / (Number(plot.dataset["count"]) - 1)) * 100}%`
    )
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
