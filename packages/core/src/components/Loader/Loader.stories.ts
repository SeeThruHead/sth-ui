import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, within } from "storybook/test"
import type { LoaderView } from "./Loader.ts"
import { loaderVars } from "./Loader.stylex.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import { present } from "../../stories/dom.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as TypesDemo from "./demos/types.ts"
import * as SizesAndColorsDemo from "./demos/sizes-and-colors.ts"
import * as CustomLoadersDemo from "./demos/custom-loaders.ts"

const meta: Meta = { title: "Feedback/Loader" }

export default meta

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Loading" })
    await expect(loader.getBoundingClientRect().width).toBe(36)
  }
}

export const Types: StoryObj = {
  render: demo(TypesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("status", { name: "Oval" })).toBeVisible()
    await expect(canvas.getByRole("status", { name: "Bars" }).children).toHaveLength(3)
    await expect(canvas.getByRole("status", { name: "Dots" }).children).toHaveLength(3)
  }
}

export const SizesAndColors: StoryObj = {
  render: demo(SizesAndColorsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findByRole("status", { name: "Extra small" })).getBoundingClientRect().width).toBe(18)
    await expect(canvas.getByRole("status", { name: "Extra large red" }).getBoundingClientRect().width).toBe(58)
    await expect(canvas.getByRole("status", { name: "Fifty pixels" }).getBoundingClientRect().width).toBe(50)
    await expect(getComputedStyle(canvas.getByRole("status", { name: "Extra large red" })).borderTopColor).toBe(
      "rgb(250, 82, 82)"
    )
    await expect(
      getComputedStyle(present(canvas.getByRole("status", { name: "Fifty pixels" }).children[0])).backgroundColor
    ).toBe("rgb(18, 184, 134)")
  }
}

export const CustomContent: StoryObj = {
  render: story(({ h, ui }) => ui.Loader(h, { children: [h.span([h.Role("img"), h.AriaLabel("Hourglass")], ["⏳"])] })),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("img", { name: "Hourglass" })).toBeVisible()
  }
}

export const DefaultLabel: StoryObj = {
  render: story(({ h, ui }) => ui.Loader(h, {})),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("status", { name: "Loading" })).toBeVisible()
  }
}

export const DefaultsFromUi: StoryObj = {
  render: story(({ h, ui }) => ui.Loader(h, { label: "Configured" }), {
    config: { components: { Loader: { defaultProps: { type: "dots", size: "xs" } } } }
  }),
  play: async ({ canvasElement }) => {
    const loader = await within(canvasElement).findByRole("status", { name: "Configured" })
    await expect(loader.children).toHaveLength(3)
    await expect(loader.getBoundingClientRect().width).toBe(18)
  }
}

const custom = stylex.create({
  ring: {
    display: "inline-block",
    width: loaderVars.size,
    height: "4px",
    backgroundColor: loaderVars.color
  }
})

const lineLoader: LoaderView = (h, root) => h.span(root(custom.ring), [])

export const CustomLoaders: StoryObj = {
  render: demo(CustomLoadersDemo.view, {
    config: { components: { Loader: { defaultProps: { loaders: { line: lineLoader } } } } }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const line = await canvas.findByRole("status", { name: "Custom line" })
    await expect(line.getBoundingClientRect().height).toBe(4)
    await expect(canvas.getByRole("status", { name: "Replaced oval" }).getBoundingClientRect().height).toBe(4)
    await expect(canvas.getByRole("status", { name: "Unknown type" }).getBoundingClientRect().height).toBe(36)
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
