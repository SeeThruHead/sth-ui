import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { demo, story } from "../../stories/harness.ts"
import { breakout } from "./Container.ts"
import { present } from "../../stories/dom.ts"

import * as UsageDemo from "./demos/usage.ts"
import * as SizesAndFluidDemo from "./demos/sizes-and-fluid.ts"
import * as GridWithBreakoutDemo from "./demos/grid-with-breakout.ts"
const meta: Meta = { title: "Layout/Container", globals: { viewport: { value: "wide", isRotated: false } } }

export default meta

const width = (element: HTMLElement) => element.getBoundingClientRect().width

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const container = await canvas.findByText("Default Container")
    await expect(width(container)).toBeLessThanOrEqual(960)
    await expect(getComputedStyle(container).paddingLeft).toBe("16px")
    await expect(width(canvas.getByText("xs Container"))).toBe(540)
    const bare = canvas.getByText("480px Container without padding")
    await expect(width(bare)).toBe(480)
    await expect(getComputedStyle(bare).paddingLeft).toBe("0px")
  }
}

export const SizesAndFluid: StoryObj = {
  render: demo(SizesAndFluidDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(width(await canvas.findByText("Size xs"))).toBe(540)
    await expect(width(canvas.getByText("Size 400"))).toBe(400)
    await expect(width(canvas.getByText("Size 30rem"))).toBe(480)
    const fluid = canvas.getByText("Fluid ignores size")
    await expect(width(fluid)).toBe(width(present(fluid.parentElement)))
  }
}

export const GridWithBreakout: StoryObj = {
  render: demo(GridWithBreakoutDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const main = await canvas.findByText("Main content, 500px wide")
    await expect(width(main)).toBe(500)
    const row = canvas.getByText("Breakout row, full width; its content lines up")
    await expect(width(row)).toBe(500)
    const fullRow = present(row.parentElement?.parentElement)
    await expect(width(fullRow)).toBe(width(present(fullRow.parentElement)))
    await expect(getComputedStyle(fullRow).backgroundColor).toBe("rgb(145, 167, 255)")
  }
}

export const BlockKeepsBreakoutContent: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Container(h, {
      size: "sm",
      children: [breakout([ui.Text(h, { children: ["In block, a breakout is ordinary content"] })])]
    })
  ),
  play: async ({ canvasElement }) => {
    const text = await within(canvasElement).findByText("In block, a breakout is ordinary content")
    await expect(width(present(text.parentElement))).toBe(720)
  }
}
