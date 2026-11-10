import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, userEvent, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import { mantineColorNames, mantineSlots, parseColor } from "../../stories/mantineColors.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as ColorsDemo from "./demos/colors.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as SectionsAndOrderDemo from "./demos/sections-and-order.ts"
import * as StylesApiDemo from "./demos/styles-api.ts"

const meta: Meta = { title: "Buttons/Button" }

export default meta

const custom = stylex.create({
  spaced: { letterSpacing: "2px" },
  label: { textTransform: "uppercase" },
  section: { color: "rgb(255, 0, 0)" }
})

const row = { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button" })
    await expect(button).toBeEnabled()
    await expect(getComputedStyle(button).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(button).color).toBe("rgb(255, 255, 255)")
    await expect(button.getBoundingClientRect().height).toBe(36)
  }
}

export const Clicking: StoryObj = {
  render: story(({ h, ui, log }) => ui.Button(h, { onClick: log("saved"), children: ["Save"] })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Save" }))
    await expect(await canvas.findByText("saved")).toBeVisible()
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = await canvas.findByRole("button", { name: "filled" })
    await expect(getComputedStyle(filled).color).toBe("rgb(255, 255, 255)")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "outline" })).borderTopStyle).toBe("solid")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "gradient" })).backgroundImage).toContain(
      "linear-gradient"
    )
  }
}

export const Colors: StoryObj = {
  render: demo(ColorsDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(await canvas.findByRole("button", { name: "Red" })).backgroundColor).toBe(
      "rgb(250, 82, 82)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Teal 3" })).backgroundColor).toBe(
      "rgb(99, 230, 190)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Auto contrast" })).color).toBe("rgb(0, 0, 0)")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Custom" })).color).toBe("rgb(255, 255, 255)")
    await expect(["rgb(0, 0, 0)", "oklch(0 0 0)"]).toContain(
      getComputedStyle(canvas.getByRole("button", { name: "Custom contrast" })).color
    )
  }
}

export const ContrastOnFilledOnly: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [h.Style(row)],
      [
        ui.Button(h, { color: "yellow", autoContrast: true, children: ["Filled"] }),
        ui.Button(h, { color: "yellow", variant: "subtle", autoContrast: true, children: ["Subtle contrast"] }),
        ui.Button(h, { color: "yellow", variant: "subtle", children: ["Subtle"] }),
        ui.Button(h, { variant: "default", autoContrast: true, children: ["Default contrast"] }),
        ui.Button(h, { variant: "default", children: ["Default"] }),
        ui.ActionIcon(h, {
          color: "yellow",
          variant: "light",
          autoContrast: true,
          label: "Light contrast",
          children: ["A"]
        }),
        ui.ActionIcon(h, { color: "yellow", variant: "light", label: "Light", children: ["A"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const color = (name: string) => getComputedStyle(canvas.getByRole("button", { name })).color
    await expect(getComputedStyle(await canvas.findByRole("button", { name: "Filled" })).color).toBe("rgb(0, 0, 0)")
    await expect(color("Subtle contrast")).toBe(color("Subtle"))
    await expect(color("Default contrast")).toBe(color("Default"))
    await expect(color("Light contrast")).toBe(color("Light"))
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect((await canvas.findByRole("button", { name: "xs" })).getBoundingClientRect().height).toBe(30)
    await expect(canvas.getByRole("button", { name: "xl" }).getBoundingClientRect().height).toBe(60)
    await expect(canvas.getByRole("button", { name: "compact-md" }).getBoundingClientRect().height).toBe(30)
  }
}

export const SectionsAndOrder: StoryObj = {
  render: demo(SectionsAndOrderDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swapped = await canvas.findByRole("button", { name: "→ Swapped ←" })
    await expect(swapped.textContent).toBe("→Swapped←")
    await expect(canvas.getByRole("button", { name: "← Both →" }).textContent).toBe("←Both→")
    const both = canvas.getByRole("button", { name: "← Both →" })
    await expect(both).toHaveAttribute("data-with-left-section")
    await expect(both).toHaveAttribute("data-with-right-section")
    await expect(within(both).getByText("←")).toHaveAttribute("data-position", "left")
    await expect(within(both).getByText("→")).toHaveAttribute("data-position", "right")
    await expect(canvas.getByRole("button", { name: "Spread ▾" })).toHaveAttribute("data-block")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Spread ▾" })).display).toBe("block")
  }
}

export const States: StoryObj = {
  render: demo(StatesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const disabled = await canvas.findByRole("button", { name: "Disabled" })
    await expect(disabled).toBeDisabled()
    await expect(canvas.getByRole("button", { name: "Loading" })).toHaveAttribute("aria-busy", "true")
    await expect(canvas.getByRole("button", { name: "Loading" })).toBeDisabled()
    await expect(disabled).toHaveAttribute("data-disabled")
    await expect(canvas.getByRole("button", { name: "Loading" })).toHaveAttribute("data-loading")
    await expect(canvas.getByText("Loading")).toHaveAttribute("data-loading")
    await expect(
      within(canvas.getByRole("button", { name: "Dots" })).getByRole("status", { hidden: true })
    ).toBeInTheDocument()
    await expect(canvas.getByRole("status", { name: "Events" }).textContent).toBe("")
  }
}

export const AsLink: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Button(h, { component: "a", href: "#docs", variant: "subtle", children: ["Read the docs"] })
  ),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("link", { name: "Read the docs" })).toHaveAttribute(
      "href",
      "#docs"
    )
  }
}

export const StylesApi: StoryObj = {
  render: demo(StylesApiDemo.view),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Styled ★" })
    await expect(button).toHaveAttribute("data-promo")
    await expect(button).toHaveAttribute("id", "styled-button")
    await expect(button.getBoundingClientRect().height).toBe(50)
    await expect(getComputedStyle(button).letterSpacing).toBe("2px")
    const label = within(button).getByText("Styled")
    await expect(label).toHaveAttribute("data-testing", "label")
    await expect(getComputedStyle(label).textTransform).toBe("uppercase")
    await expect(getComputedStyle(within(button).getByText("★")).color).toBe("rgb(255, 0, 0)")
    await expect(getComputedStyle(button).borderTopLeftRadius).toBe("32px")
  }
}

export const Unstyled: StoryObj = {
  render: story(({ h, ui }) => ui.Button(h, { unstyled: true, children: ["Bare"] })),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Bare" })
    await expect(getComputedStyle(button).backgroundColor).not.toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(button).height).not.toBe("36px")
  }
}

export const GroupPositions: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [],
      [
        h.div(
          [h.Role("group"), h.AriaLabel("Horizontal")],
          (["first", "middle", "last"] as const).map((groupPosition) =>
            ui.Button(h, { variant: "default", groupPosition, children: [groupPosition] })
          )
        ),
        h.div(
          [
            h.Role("group"),
            h.AriaLabel("Vertical"),
            h.Style({ display: "flex", flexDirection: "column", width: "120px" })
          ],
          (["first", "middle", "last", "only"] as const).map((groupPosition) =>
            ui.Button(h, { groupPosition, groupOrientation: "vertical", children: [`v ${groupPosition}`] })
          )
        )
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = await canvas.findByRole("button", { name: "first" })
    await expect(getComputedStyle(first).borderTopRightRadius).toBe("0px")
    await expect(getComputedStyle(first).borderTopLeftRadius).toBe("8px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "middle" })).borderTopLeftRadius).toBe("0px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "last" })).borderTopRightRadius).toBe("8px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "v first" })).borderBottomLeftRadius).toBe("0px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "v middle" })).borderTopLeftRadius).toBe("0px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "v last" })).borderTopLeftRadius).toBe("0px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "v only" })).borderTopLeftRadius).toBe("8px")
  }
}

export const GradientAndRadius: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [h.Style(row)],
      [
        ui.Button(h, { variant: "gradient", gradient: { from: "violet", to: "pink.4", deg: 90 }, children: ["Named"] }),
        ui.Button(h, { variant: "gradient", gradient: { from: "#000000", to: "#ffffff" }, children: ["Hex"] }),
        ui.Button(h, { radius: 3, children: ["Three pixels"] }),
        ui.Button(h, { radius: "xs", children: ["Extra small"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(await canvas.findByRole("button", { name: "Named" })).backgroundImage).toBe(
      "linear-gradient(90deg, rgb(121, 80, 242) 0%, rgb(247, 131, 172) 100%)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Hex" })).backgroundImage).toBe(
      "linear-gradient(0deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Three pixels" })).borderTopLeftRadius).toBe("3px")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Extra small" })).borderTopLeftRadius).toBe("2px")
  }
}

export const DefaultsFromUi: StoryObj = {
  render: story(({ h, ui }) => ui.Button(h, { children: ["Configured"] }), {
    config: {
      components: {
        Button: { defaultProps: { variant: "outline", size: "xl", radius: "xl" }, styles: { label: custom.label } }
      }
    }
  }),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Configured" })
    await expect(button.getBoundingClientRect().height).toBe(60)
    await expect(getComputedStyle(button).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(getComputedStyle(within(button).getByText("Configured")).textTransform).toBe("uppercase")
  }
}

const variantsOf = ["light", "filled", "outline"] as const

const paletteButtons = story(({ h, ui }) =>
  ui.Stack(h, {
    children: mantineColorNames.map((color) =>
      ui.Group(h, {
        children: variantsOf.map((variant) => ui.Button(h, { variant, color, children: [`${color} ${variant}`] }))
      })
    )
  })
)

const buttonsMatchMantine =
  (scheme: "light" | "dark") =>
  async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole("button", { name: `${mantineColorNames[0] ?? ""} light` })
    await Promise.all(
      mantineColorNames.map(async (color) => {
        const expected = mantineSlots(color, scheme)
        const style = (variant: string) => getComputedStyle(canvas.getByRole("button", { name: `${color} ${variant}` }))
        await expect(parseColor(style("light").backgroundColor), `${color} light background`).toEqual(expected.light)
        await expect(parseColor(style("light").color), `${color} light colour`).toEqual(expected.lightColor)
        await expect(parseColor(style("filled").backgroundColor), `${color} filled`).toEqual(expected.filled)
        await expect(parseColor(style("outline").borderTopColor), `${color} outline`).toEqual(expected.outline)
      })
    )
  }

export const LightColors: StoryObj = { render: paletteButtons, play: buttonsMatchMantine("light") }

export const LightColorsDark: StoryObj = {
  globals: { scheme: "dark" },
  render: paletteButtons,
  play: buttonsMatchMantine("dark")
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: { ...initialArgs(ConfiguratorDemo.configurator.controls), variant: "light", size: "xl" },
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Button" })
    await expect(button.getBoundingClientRect().height).toBe(60)
    await expect(getComputedStyle(button).color).toBe("rgb(24, 100, 171)")
  }
}
