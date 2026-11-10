import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as WeightsDemo from "./demos/weights.ts"
import * as GradientDemo from "./demos/gradient.ts"
import * as TruncateAndClampDemo from "./demos/truncate-and-clamp.ts"
import * as InheritAndInlineDemo from "./demos/inherit-and-inline.ts"

const meta: Meta = { title: "Typography/Text" }

export default meta

const long =
  "Foldkit keeps the whole state in one model and updates it with messages, so every screen is a function of data."

const style = (element: HTMLElement) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(style(await canvas.findByText("Extra small text")).fontSize).toBe("12px")
    await expect(style(canvas.getByText("Bold")).fontWeight).toBe("700")
    await expect(style(canvas.getByText("Italic")).fontStyle).toBe("italic")
    await expect(style(canvas.getByText("Strikethrough")).textDecorationLine).toBe("line-through")
    await expect(style(canvas.getByText("Blue text")).color).toBe("rgb(34, 139, 230)")
    await expect(style(canvas.getByText("Teal 4 text")).color).toBe("rgb(56, 217, 169)")
    await expect(style(canvas.getByText("capitalized text")).textTransform).toBe("capitalize")
    await expect(style(canvas.getByText("Aligned to right")).textAlign).toBe("right")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(style(await canvas.findByText("Text size xs")).fontSize).toBe("12px")
    await expect(style(canvas.getByText("Text size xl")).fontSize).toBe("20px")
    await expect(style(canvas.getByText("Text size md")).lineHeight).toBe(`${16 * 1.55}px`)
    await expect(canvas.getByText("Text size md").tagName).toBe("P")
  }
}

export const Weights: StoryObj = {
  render: demo(WeightsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(style(await canvas.findByText("Semibold")).fontWeight).toBe("500")
    await expect(style(canvas.getByText("Dimmed")).color).toBe("rgb(134, 142, 150)")
    await expect(style(canvas.getByText("Centred")).textAlign).toBe("center")
    await expect(style(canvas.getByText("Twenty-six pixels")).fontSize).toBe("26px")
  }
}

export const Gradient: StoryObj = {
  render: demo(GradientDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(style(await canvas.findByText("Default gradient")).backgroundImage).toBe(
      "linear-gradient(45deg, rgb(34, 139, 230) 0%, rgb(21, 170, 191) 100%)"
    )
    await expect(style(canvas.getByText("Grape to orange")).backgroundImage).toBe(
      "linear-gradient(90deg, rgb(190, 75, 219) 0%, rgb(253, 126, 20) 100%)"
    )
    await expect(style(canvas.getByText("Grape to orange")).webkitTextFillColor).toBe("rgba(0, 0, 0, 0)")
  }
}

export const TruncateAndClamp: StoryObj = {
  render: demo(TruncateAndClampDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const end = await canvas.findByText(long)
    await expect(end).toHaveAttribute("data-truncate", "end")
    await expect(canvas.getByText(`Start: ${long}`)).toHaveAttribute("data-truncate", "start")
    await expect(canvas.getByText(`Clamped: ${long}`)).toHaveAttribute("data-line-clamp")
    await expect(style(end).textOverflow).toBe("ellipsis")
    await expect(end.scrollWidth).toBeGreaterThan(end.clientWidth)
    await expect(style(canvas.getByText(`Start: ${long}`)).direction).toBe("rtl")
    const clamped = canvas.getByText(`Clamped: ${long}`)
    await expect(style(clamped).webkitLineClamp).toBe("2")
    await expect(clamped.getBoundingClientRect().height).toBeCloseTo(16 * 1.55 * 2, 0)
  }
}

export const InheritAndInline: StoryObj = {
  render: demo(InheritAndInlineDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const inherited = await canvas.findByText("Inherits 24px bold")
    await expect(style(inherited).fontSize).toBe("24px")
    await expect(style(inherited).fontWeight).toBe("700")
    const inline = canvas.getByText("Inline span")
    await expect(inline).toHaveAttribute("data-inline")
    await expect(inherited).toHaveAttribute("data-inherit")
    await expect(inline.tagName).toBe("SPAN")
    await expect(style(inline).lineHeight).toBe("16px")
    const label = canvas.getByText("A label, balanced")
    await expect(label.tagName).toBe("LABEL")
    await expect(style(label).textWrap).toBe("balance")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Gradient Text")).toBeVisible()
  }
}
