import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { demo } from "../../stories/harness.ts"
import * as BlockDemo from "./demos/block.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Typography/Code" }

export default meta

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const code = await within(canvasElement).findByText("React.createElement()")
    await expect(code.tagName).toBe("CODE")
    await expect(code).toHaveAttribute("dir", "ltr")
    await expect(css(code).fontSize).toBe("12px")
    await expect(css(code).padding).toBe("2px 5px")
    await expect(css(code).borderTopLeftRadius).toBe("4px")
    await expect(css(code).backgroundColor).toBe("rgb(248, 249, 250)")
    await expect(css(code).fontFamily).toContain("monospace")
    await expect(css(code).lineHeight).toBe("18.6px")
  }
}

export const Block: StoryObj = {
  render: demo(BlockDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const block = await within(canvasElement).findByText(/ui\.Code\(h/)
    await expect(block.tagName).toBe("PRE")
    await expect(block).toHaveAttribute("data-block")
    await expect(css(block).padding).toBe("10px")
    await expect(css(block).whiteSpace).toBe("pre")
    await expect(css(block).overflowX).toBe("auto")
  }
}

export const Colors: StoryObj = {
  render: demo(ColorsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const [dark, light] = await within(canvasElement).findAllByText("React.createElement()")
    await expect(css(dark).backgroundColor).toBe("rgb(24, 100, 171)")
    await expect(css(dark).color).toBe("rgb(255, 255, 255)")
    await expect(css(light).backgroundColor).toBe("rgb(208, 235, 255)")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const code = await within(canvasElement).findByText("React.createElement()")
    await expect(css(code).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}
