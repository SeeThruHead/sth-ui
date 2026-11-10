import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as OrdersDemo from "./demos/orders.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as ClampAndWrapDemo from "./demos/clamp-and-wrap.ts"

const meta: Meta = { title: "Typography/Title" }

export default meta

const style = (element: HTMLElement) => getComputedStyle(element)

export const Orders: StoryObj = {
  render: demo(OrdersDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const h1 = await canvas.findByRole("heading", { level: 1, name: "This is h1 title" })
    await expect(style(h1).fontSize).toBe("34px")
    await expect(style(h1).fontWeight).toBe("700")
    await expect(style(canvas.getByRole("heading", { level: 6 })).fontSize).toBe("14px")
    await expect(style(canvas.getByRole("heading", { level: 3 })).lineHeight).toBe("30.8px")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(style(await canvas.findByRole("heading", { level: 3 })).fontSize).toBe("34px")
    await expect(canvas.getByRole("heading", { name: "No order is h1" }).tagName).toBe("H1")
    await expect(style(canvas.getByRole("heading", { name: "h1 at size xs" })).fontSize).toBe("12px")
    await expect(style(canvas.getByRole("heading", { level: 2 })).fontSize).toBe("40px")
    await expect(style(canvas.getByRole("heading", { level: 2 })).color).toBe("rgb(190, 75, 219)")
    await expect(style(canvas.getByRole("heading", { name: "h4 at 1.5rem" })).fontSize).toBe("24px")
  }
}

export const ClampAndWrap: StoryObj = {
  render: demo(ClampAndWrapDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const clamped = await canvas.findByRole("heading", { level: 3 })
    await expect(clamped).toHaveAttribute("data-order", "3")
    await expect(clamped).toHaveAttribute("data-line-clamp")
    await expect(canvas.getByRole("heading", { level: 4 })).not.toHaveAttribute("data-line-clamp")
    await expect(style(clamped).webkitLineClamp).toBe("1")
    await expect(clamped.getBoundingClientRect().height).toBeCloseTo(22 * 1.4, 0)
    await expect(style(canvas.getByRole("heading", { level: 4 })).textWrap).toBe("balance")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("heading", { level: 2 })).toBeVisible()
  }
}
