import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { demo } from "@sth-ui/core/stories/harness.ts"
import * as OptionsDemo from "./demos/options.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Charts/Treemap" }

export default meta

const shown = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).filter(
    (tooltip) => getComputedStyle(tooltip).display !== "none"
  )

const node = (root: HTMLElement, name: string) =>
  present(
    Array.from(root.querySelectorAll<HTMLElement>("[data-segment]")).find((element) => element.textContent === name)
  )

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByText("React")
    const segments = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-segment]"))
    await expect(segments).toHaveLength(8)
    await expect(present(segments[0]?.parentElement).getBoundingClientRect().height).toBe(300)
    const react = node(canvasElement, "React")
    await expect(getComputedStyle(react).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(react).toHaveAttribute("data-depth", "2")
    await userEvent.hover(react)
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(present(shown(canvasElement)[0])).toHaveTextContent("React400")
  }
}

export const Options: StoryObj = {
  render: demo(OptionsDemo.view),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByText("Rent")
    const [first, second] = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-segment]")).filter(
      (element) => element.textContent === "Rent"
    )
    await expect(getComputedStyle(present(first)).color).toBe("oklch(0 0 0)")
    const food = present(
      Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-segment]")).find(
        (element) => element.textContent === "Food"
      )
    )
    await expect(getComputedStyle(food).color).toBe("oklch(1 0 0)")
    await expect(getComputedStyle(present(first)).borderTopWidth).toBe("3px")
    await expect(getComputedStyle(present(second)).color).toBe("rgb(20, 20, 20)")
    await expect(
      Array.from(canvasElement.querySelectorAll("[data-segment]")).filter((element) => element.textContent === "Tiny")
    ).toHaveLength(0)
    await userEvent.hover(present(first))
    await waitFor(() => expect(shown(canvasElement)).toHaveLength(1))
    await expect(present(shown(canvasElement)[0])).toHaveTextContent("Rent$1200")
  }
}
