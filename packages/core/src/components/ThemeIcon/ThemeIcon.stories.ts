import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import type { ThemeIconSize } from "./ThemeIcon.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as GradientDemo from "./demos/gradient.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as ColorsAndStylesDemo from "./demos/colors-and-styles.ts"

const meta: Meta = { title: "Data display/ThemeIcon" }

export default meta

const sizes: ReadonlyArray<ThemeIconSize> = ["xs", "sm", "md", "lg", "xl"]

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, {
    centered: true
  }),
  play: async ({ canvasElement }) => {
    const icon = await within(canvasElement).findByRole("img", { name: "Photos" })
    await expect(box(icon).width).toBe(28)
    await expect(css(icon).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(icon).color).toBe("rgb(255, 255, 255)")
    await expect(css(icon).borderTopLeftRadius).toBe("8px")
    await expect(box(icon.querySelector("svg")).width).toBeCloseTo(18.2, 0)
    await expect(icon).toHaveAttribute("data-variant", "filled")
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("img", { name: "filled" })
    await expect(css(canvas.getByRole("img", { name: "outline" })).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(css(canvas.getByRole("img", { name: "white" })).color).toBe("rgb(34, 139, 230)")
    await expect(css(canvas.getByRole("img", { name: "transparent" })).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(css(canvas.getByRole("img", { name: "gradient" })).backgroundImage).toContain("linear-gradient")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("img", { name: "xs" })
    await expect(sizes.map((size) => box(canvas.getByRole("img", { name: size })).width)).toEqual([18, 22, 28, 34, 44])
    await expect(box(canvas.getByRole("img", { name: "60 pixels" })).height).toBe(60)
    await expect(css(canvas.getByRole("img", { name: "60 pixels" })).borderTopLeftRadius).toBe("32px")
    await expect(box(canvas.getByRole("img", { name: "4rem" })).width).toBe(64)
  }
}

export const Gradient: StoryObj = {
  render: demo(GradientDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const icon = await within(canvasElement).findByRole("img", { name: "Gradient action icon" })
    await expect(css(icon).backgroundImage).toBe("linear-gradient(90deg, rgb(34, 139, 230) 0%, rgb(21, 170, 191) 100%)")
    await expect(box(icon).width).toBe(44)
  }
}

export const AutoContrast: StoryObj = {
  render: demo(AutoContrastDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByRole("img", { name: "Default" })).color).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByRole("img", { name: "Auto contrast" })).color).toBe("rgb(0, 0, 0)")
  }
}

export const ColorsAndStyles: StoryObj = {
  render: demo(ColorsAndStylesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByRole("img", { name: "Custom" })).backgroundColor).toBe("rgb(112, 72, 232)")
    await expect(css(canvas.getByRole("img", { name: "Teal" })).color).toBe("rgb(8, 127, 91)")
    await expect(css(canvas.getByRole("img", { name: "Styled" })).borderTopWidth).toBe("2px")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story(
    ({ h, ui }) =>
      ui.Group(h, {
        children: (["default", "light"] as const).map((variant) =>
          ui.ThemeIcon(h, { variant, ...named(variant), children: [HeartIcon(h)] })
        )
      }),
    { centered: true }
  ),
  play: async ({ canvasElement }) => {
    const icon = await within(canvasElement).findByRole("img", { name: "default" })
    await expect(css(icon).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async (context) => Usage.play?.(context)
}
