import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as AlignAndJustifyDemo from "./demos/align-and-justify.ts"

const meta: Meta = { title: "Layout/Stack" }

export default meta

const parentStyle = (element: HTMLElement) => getComputedStyle(present(element.parentElement))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "1" })
    await expect(parentStyle(first).justifyContent).toBe("center")
    await expect(parentStyle(first).flexDirection).toBe("column")
    await expect(parentStyle(first).rowGap).toBe("16px")
    const second = canvas.getByRole("button", { name: "2" })
    await expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(16)
    await expect(first.getBoundingClientRect().width).toBe(present(first.parentElement).getBoundingClientRect().width)
  }
}

export const AlignAndJustify: StoryObj = {
  render: demo(AlignAndJustifyDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const top = await canvas.findByRole("button", { name: "Top" })
    await expect(parentStyle(top).alignItems).toBe("center")
    await expect(parentStyle(top).justifyContent).toBe("flex-end")
    await expect(parentStyle(top).rowGap).toBe("10px")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
