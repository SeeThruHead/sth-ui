import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as AlignDemo from "./demos/align.ts"
import * as CompoundDemo from "./demos/compound.ts"
import * as IndicatorBackgroundDemo from "./demos/indicator-background.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantDemo from "./demos/variant.ts"

const meta: Meta = { title: "Feedback/EmptyState" }

export default meta

const box = (element: Element | null | undefined) => present(element).getBoundingClientRect()

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const rootOf = (element: Element) => present(element.closest("[data-align]"))

const indicatorOf = (element: Element) => present(rootOf(element).firstElementChild)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByText("No results found")
    const root = rootOf(title)
    await expect(root).toHaveAttribute("data-align", "center")
    await expect(css(root).flexDirection).toBe("column")
    await expect(css(root).alignItems).toBe("center")
    await expect(css(root).rowGap).toBe("10px")
    await expect(title.tagName).toBe("DIV")
    await expect(css(title).fontSize).toBe("18px")
    await expect(css(title).fontWeight).toBe("600")
    await expect(css(title).color).toBe("rgb(0, 0, 0)")
    const description = canvas.getByText(/We couldn't find anything/)
    await expect(description.tagName).toBe("P")
    await expect(css(description).fontSize).toBe("14px")
    await expect(css(description).maxWidth).toBe("512px")
    await expect(css(description).textAlign).toBe("center")
    await expect(css(description).color).toBe("rgb(134, 142, 150)")
    const indicator = indicatorOf(title)
    await expect(indicator).not.toHaveAttribute("data-with-background")
    await expect(css(indicator).color).toBe("rgb(134, 142, 150)")
    await expect(box(indicator.querySelector("svg")).width).toBe(48)
    await expect(canvas.getByRole("button", { name: "Reset filters" })).toBeVisible()
    await expect(Math.round(box(description).bottom + 10)).toBe(
      Math.round(box(canvas.getByRole("button", { name: "Reset filters" }).parentElement).top)
    )
  }
}

export const Compound: StoryObj = {
  render: demo(CompoundDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole("heading", { level: 3, name: "No results found" })
    await expect(css(title).marginTop).toBe("0px")
    const reset = canvas.getByRole("button", { name: "Reset filters" })
    const create = canvas.getByRole("button", { name: "Create new" })
    await expect(Math.round(box(create).left - box(reset).right)).toBe(12)
    await expect(canvas.getByText("Results are refreshed every five minutes.")).toBeVisible()
  }
}

export const Variant: StoryObj = {
  render: demo(VariantDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [light, filled] = await canvas.findAllByText("No results found")
    const lightIndicator = indicatorOf(present(light))
    await expect(lightIndicator).toHaveAttribute("data-with-background")
    await expect(rootOf(present(light))).toHaveAttribute("data-variant", "light")
    await expect(box(lightIndicator).width).toBe(96)
    await expect(css(lightIndicator).borderTopLeftRadius).toBe("1000px")
    await expect(css(lightIndicator).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(lightIndicator).color).toBe("rgb(24, 100, 171)")
    const filledIndicator = indicatorOf(present(filled))
    await expect(css(filledIndicator).backgroundColor).toBe("rgb(18, 184, 134)")
    await expect(css(filledIndicator).color).toBe("rgb(255, 255, 255)")
  }
}

export const IndicatorBackground: StoryObj = {
  render: demo(IndicatorBackgroundDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const indicator = indicatorOf(await canvas.findByText("Your cart is empty"))
    await expect(indicator).toHaveAttribute("data-with-background")
    await expect(css(indicator).backgroundColor).toBe("rgb(241, 243, 245)")
    await expect(css(indicator).color).toBe("rgb(134, 142, 150)")
  }
}

export const Align: StoryObj = {
  render: demo(AlignDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = rootOf(await canvas.findByText("Aligned left"))
    const right = rootOf(canvas.getByText("Aligned right"))
    await expect(css(left).flexDirection).toBe("row")
    await expect(css(right).flexDirection).toBe("row-reverse")
    await expect(css(left).columnGap).toBe("8px")
    await expect(box(left.firstElementChild).left).toBe(box(left).left)
    await expect(Math.round(box(right.firstElementChild).right)).toBe(Math.round(box(right).right))
    await expect(css(canvas.getByText("Aligned left")).textAlign).toBe("left")
    await expect(css(canvas.getByText("Aligned right")).textAlign).toBe("right")
    await expect(css(present(right.lastElementChild)).alignItems).toBe("flex-end")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const sizes = [
      ["xs", 64, "14px", "12px"],
      ["sm", 80, "16px", "14px"],
      ["md", 96, "18px", "14px"],
      ["lg", 120, "20px", "16px"],
      ["xl", 144, "24px", "18px"]
    ] as const
    await canvas.findByText("Size xs")
    await Promise.all(
      sizes.map(async ([size, indicator, title, description]) => {
        const heading = canvas.getByText(`Size ${size}`)
        await expect(box(indicatorOf(heading)).width).toBe(indicator)
        await expect(css(heading).fontSize).toBe(title)
        await expect(css(present(heading.nextElementSibling)).fontSize).toBe(description)
      })
    )
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(IndicatorBackgroundDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByText("Your cart is empty")
    await expect(css(title).color).toBe("rgb(255, 255, 255)")
    await expect(css(indicatorOf(title)).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Bare: StoryObj = {
  render: demo((h, ui) =>
    ui.Group(h, {
      children: [
        ui.EmptyState(h, { icon: "∅", attributes: { root: { "data-testid": "icon-only" } } }),
        ui.EmptyState(h, { title: "Nothing yet", attributes: { root: { "data-testid": "title-only" } } })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findByTestId("icon-only")).children).toHaveLength(1)
    const titleOnly = canvas.getByTestId("title-only")
    await expect(titleOnly.children).toHaveLength(1)
    await expect(titleOnly.firstElementChild).toHaveTextContent("Nothing yet")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No results found")).toBeVisible()
  }
}
