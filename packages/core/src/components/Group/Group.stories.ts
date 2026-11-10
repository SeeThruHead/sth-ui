import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as PositionsDemo from "./demos/positions.ts"
import * as NoWrapDemo from "./demos/no-wrap.ts"
import * as GrowDemo from "./demos/grow.ts"

const meta: Meta = { title: "Layout/Group" }

export default meta

const style = (element: Element) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "First" })
    const group = present(first.parentElement)
    await expect(style(group).display).toBe("flex")
    await expect(style(group).columnGap).toBe("16px")
    await expect(style(group).alignItems).toBe("center")
    await expect(group).toHaveAttribute("data-demo", "usage")
  }
}

export const Positions: StoryObj = {
  render: demo(PositionsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByRole("button", { name: "Left" })
    await expect(style(present(left.parentElement)).justifyContent).toBe("space-between")
    await expect(style(present(left.parentElement)).columnGap).toBe("10px")
    const end = canvas.getByRole("button", { name: "End" })
    await expect(style(present(end.parentElement)).justifyContent).toBe("flex-end")
    await expect(style(present(end.parentElement)).columnGap).toBe("4px")
  }
}

export const NoWrap: StoryObj = {
  render: demo(NoWrapDemo.view),
  play: async ({ canvasElement }) => {
    const one = await within(canvasElement).findByRole("button", { name: "One" })
    await expect(style(present(one.parentElement)).flexWrap).toBe("nowrap")
  }
}

export const Grow: StoryObj = {
  render: demo(GrowDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const short = await canvas.findByRole("button", { name: "Short" })
    await expect(short.closest("[data-grow]")).not.toBeNull()
    const cells = [short, canvas.getByRole("button", { name: "Mid" })].map((button) => present(button.parentElement))
    await expect(cells[0]?.getBoundingClientRect().width).toBeCloseTo(cells[1]?.getBoundingClientRect().width ?? 0, 0)
    await expect(short.getBoundingClientRect().width).toBeCloseTo(cells[0]?.getBoundingClientRect().width ?? 0, 0)
    await expect(style(present(cells[0])).maxWidth).not.toBe("none")
    const free = present(canvas.getByRole("button", { name: "Free" }).parentElement)
    await expect(style(free).maxWidth).toBe("none")
    await expect(style(free).flexGrow).toBe("1")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
