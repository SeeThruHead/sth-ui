import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as InACrampedRowDemo from "./demos/in-acramped-row.ts"

const meta: Meta = { title: "Layout/Space" }

export default meta

const gapBetween = (before: HTMLElement, after: HTMLElement): number =>
  after.getBoundingClientRect().left - before.getBoundingClientRect().right

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByText("First line")
    const second = canvas.getByText("Second line, 16px further down")
    const third = canvas.getByText("Third line, 40px further down")
    await expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(16)
    await expect(third.getBoundingClientRect().top - second.getBoundingClientRect().bottom).toBe(40)
  }
}

export const InACrampedRow: StoryObj = {
  render: demo(InACrampedRowDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = await canvas.findByText("A long left label")
    const right = canvas.getByText("A long right label")
    await expect(gapBetween(left, right)).toBe(32)
    await expect(gapBetween(right, canvas.getByText("End"))).toBeLessThan(24)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
