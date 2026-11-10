import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Typography/Mark" }

export default meta

const css = (element: Element) => getComputedStyle(element)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const mark = await within(canvasElement).findByText("this chunk")
    await expect(mark.tagName).toBe("MARK")
    await expect(css(mark).backgroundColor).toBe("rgb(255, 236, 153)")
    await expect(css(mark).color).toBe("rgb(0, 0, 0)")
    await expect(mark.parentElement).toHaveTextContent("Highlight this chunk of the text")
  }
}

export const Colors: StoryObj = {
  render: demo(ColorsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByText("theme colour")).backgroundColor).toBe("rgb(150, 242, 215)")
    await expect(css(canvas.getByText("exact shade")).backgroundColor).toBe("rgb(255, 135, 135)")
    await expect(css(canvas.getByText("CSS colour")).backgroundColor).toBe("rgb(208, 191, 255)")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(ColorsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const theme = await canvas.findByText("theme colour")
    await expect(css(theme).backgroundColor).toBe("rgb(32, 201, 151)")
    await expect(css(theme).color).toBe("rgb(0, 0, 0)")
    await expect(css(canvas.getByText("exact shade")).backgroundColor).toBe("rgb(255, 135, 135)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("this chunk")).toBeVisible()
  }
}
