import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "DataDisplay/Kbd" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const shift = await within(canvasElement).findByText("Shift")
    await expect(shift.tagName).toBe("KBD")
    await expect(css(shift).fontSize).toBe("12px")
    await expect(css(shift).padding).toBe("1.44px 5.4px")
    await expect(css(shift).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(shift).color).toBe("rgb(73, 80, 87)")
    await expect(css(shift).borderTopLeftRadius).toBe("4px")
    await expect(css(shift).borderTopWidth).toBe("1px")
    await expect(css(shift).borderBottomWidth).toBe("3px")
    await expect(css(shift).borderTopColor).toBe("rgb(222, 226, 230)")
    await expect(css(shift).fontWeight).toBe("700")
    await expect(css(shift).fontFamily).toContain("monospace")
    await expect(within(canvasElement).getByText("⌘").tagName).toBe("KBD")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("xl")
    const sizes = ["xs", "sm", "md", "lg", "xl", "24"].map(
      (label) => css(within(canvasElement).getByText(label)).fontSize
    )
    await expect(sizes).toEqual(["10px", "12px", "14px", "16px", "20px", "24px"])
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const shift = await within(canvasElement).findByText("Shift")
    await expect(css(shift).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(shift).color).toBe("rgb(201, 201, 201)")
    await expect(css(shift).borderTopColor).toBe("rgb(66, 66, 66)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Shift")).toBeVisible()
  }
}
