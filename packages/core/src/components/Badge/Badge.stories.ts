import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { mantineColorNames, mantineSlots, parseColor } from "../../stories/mantineColors.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import type { BadgeSize } from "./Badge.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as GradientDemo from "./demos/gradient.ts"
import * as RoundedDemo from "./demos/rounded.ts"
import * as SectionsDemo from "./demos/sections.ts"
import * as FullWidthDemo from "./demos/full-width.ts"
import * as AutoContrastDemo from "./demos/auto-contrast.ts"
import * as ColorsAndRadiusDemo from "./demos/colors-and-radius.ts"
import * as StylesApiDemo from "./demos/styles-api.ts"
import * as AsLinkDemo from "./demos/as-link.ts"

const meta: Meta = { title: "Data display/Badge" }

export default meta

const sizes: ReadonlyArray<BadgeSize> = ["xs", "sm", "md", "lg", "xl"]

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const badge = await within(canvasElement).findByText("Badge")
    const root = present(badge.parentElement)
    await expect(box(root).height).toBe(20)
    await expect(css(root).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(root).textTransform).toBe("uppercase")
    await expect(css(root).borderTopLeftRadius).toBe("1000px")
    await expect(root).toHaveAttribute("data-variant", "filled")
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rootOf = (name: string) => present(canvas.getByText(name).parentElement)
    await canvas.findByText("filled")
    await expect(css(rootOf("light")).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(css(rootOf("outline")).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(css(rootOf("dot")).borderTopColor).toBe("rgb(206, 212, 218)")
    await expect(css(rootOf("dot").firstElementChild).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(rootOf("white")).color).toBe("rgb(34, 139, 230)")
    await expect(css(rootOf("gradient")).backgroundImage).toContain("linear-gradient")
    await expect(rootOf("dot")).toHaveAttribute("data-variant", "dot")
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heightOf = (size: string) => box(canvas.getByText(`Size ${size}`).parentElement).height
    await canvas.findByText("Size xs")
    await expect(sizes.map(heightOf)).toEqual([16, 18, 20, 26, 32])
    await expect(css(canvas.getByText("Size xl")).fontSize).toBe("16px")
  }
}

export const Gradient: StoryObj = {
  render: demo(GradientDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText("Gradient badge")
    await expect(css(label.parentElement).backgroundImage).toBe(
      "linear-gradient(90deg, rgb(34, 139, 230) 0%, rgb(21, 170, 191) 100%)"
    )
  }
}

export const Rounded: StoryObj = {
  render: demo(RoundedDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const xl = present((await canvas.findByText("8")).parentElement)
    await expect(box(xl).width).toBe(32)
    await expect(box(xl).height).toBe(32)
    await expect(xl).toHaveAttribute("data-circle")
  }
}

export const Sections: StoryObj = {
  render: demo(SectionsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = present((await canvas.findByText("With left section")).parentElement)
    const right = present(canvas.getByText("With right section").parentElement)
    await expect(left).toHaveAttribute("data-with-left-section")
    await expect(right).toHaveAttribute("data-with-right-section")
    await expect(left.firstElementChild).toHaveAttribute("data-position", "left")
    await expect(right.lastElementChild).toHaveAttribute("data-position", "right")
    await expect(css(left).gridTemplateColumns).toMatch(/^\d+(\.\d+)?px \d+(\.\d+)?px$/)
    await expect(left.querySelector("svg")).toHaveAttribute("data-icon", "at")
  }
}

export const FullWidth: StoryObj = {
  render: demo(FullWidthDemo.view),
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText("Full width badge")
    const root = present(label.parentElement)
    await expect(box(root).width).toBe(400)
    await expect(root).toHaveAttribute("data-block")
  }
}

export const AutoContrast: StoryObj = {
  render: demo(AutoContrastDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css((await canvas.findByText("Default")).parentElement).color).toBe("rgb(255, 255, 255)")
    await expect(css(canvas.getByText("Auto contrast").parentElement).color).toBe("rgb(0, 0, 0)")
  }
}

export const ColorsAndRadius: StoryObj = {
  render: demo(ColorsAndRadiusDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rootOf = (name: string) => present(canvas.getByText(name).parentElement)
    await canvas.findByText("Teal")
    await expect(css(rootOf("Teal")).color).toBe("rgb(8, 127, 91)")
    await expect(css(rootOf("Red 7")).backgroundColor).toBe("rgb(240, 62, 62)")
    await expect(css(rootOf("Custom")).borderTopColor).toBe("rgb(112, 72, 232)")
    await expect(css(rootOf("Square-ish")).borderTopLeftRadius).toBe("4px")
  }
}

export const StylesApi: StoryObj = {
  render: demo(StylesApiDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const root = await within(canvasElement).findByLabelText("Styled badge")
    await expect(box(root).height).toBe(28)
    await expect(css(root).textTransform).toBe("none")
    await expect(css(within(root).getByText("Badge component")).fontStyle).toBe("italic")
    await expect(css(root.firstElementChild).color).toBe("rgb(250, 82, 82)")
  }
}

export const AsLink: StoryObj = {
  render: demo(AsLinkDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("link", { name: "v2.0" })).toHaveAttribute("href", "#releases")
  }
}

export const Unstyled: StoryObj = {
  render: story(({ h, ui }) => ui.Badge(h, { unstyled: true, children: ["Plain"] })),
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText("Plain")
    await expect(css(label.parentElement).textTransform).toBe("none")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story(
    ({ h, ui }) =>
      ui.Group(h, {
        children: (["dot", "default", "light"] as const).map((variant) => ui.Badge(h, { variant, children: [variant] }))
      }),
    { centered: true }
  ),
  play: async ({ canvasElement }) => {
    const dot = present((await within(canvasElement).findByText("dot")).parentElement)
    await expect(css(dot).backgroundColor).toBe("rgb(59, 59, 59)")
    await expect(css(dot).color).toBe("rgb(255, 255, 255)")
  }
}

export const CssLengthSize: StoryObj = {
  render: story(({ h, ui }) => ui.Badge(h, { size: "2rem", children: ["Size 2rem"] })),
  play: async ({ canvasElement }) => {
    const root = present((await within(canvasElement).findByText("Size 2rem")).parentElement)
    await expect(box(root).height).toBe(32)
    await expect(css(root).fontSize).toBe("32px")
  }
}

const paletteBadges = story(({ h, ui }) =>
  ui.Group(h, {
    children: mantineColorNames.map((color) => ui.Badge(h, { variant: "light", color, children: [color] }))
  })
)

const matchesMantine =
  (scheme: "light" | "dark") =>
  async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
    await within(canvasElement).findByText(mantineColorNames[0] ?? "")
    await Promise.all(
      mantineColorNames.map(async (color) => {
        const badge = present(within(canvasElement).getByText(color).closest("[data-variant]"))
        const expected = mantineSlots(color, scheme)
        await expect(parseColor(css(badge).backgroundColor), `${color} light background`).toEqual(expected.light)
        await expect(parseColor(css(badge).color), `${color} light colour`).toEqual(expected.lightColor)
      })
    )
  }

export const LightColors: StoryObj = { render: paletteBadges, play: matchesMantine("light") }

export const LightColorsDark: StoryObj = {
  globals: { scheme: "dark" },
  render: paletteBadges,
  play: matchesMantine("dark")
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Badge")).toBeVisible()
  }
}
