import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demo, story } from "../stories/harness.ts"
import { present } from "../stories/dom.ts"
import { sx } from "../styles/StylesApi.ts"
import { colors, font, radius } from "./tokens.stylex.ts"
import * as ColorSchemesDemo from "./demos/color-schemes.ts"
import * as CustomThemeDemo from "./demos/custom-theme.ts"
import * as EveryAccentDemo from "./demos/every-accent.ts"

const meta: Meta = { title: "Theming/Theme" }

export default meta

const serifTheme = stylex.createTheme(font, { body: "Georgia, serif" })

const surface = stylex.create({
  panel: { padding: "16px", color: colors.text, backgroundColor: colors.body, borderRadius: radius.default },
  row: { display: "flex", gap: "8px", flexWrap: "wrap" },
  padded: { padding: "24px" }
})

export const ColorSchemes: StoryObj = {
  render: demo(ColorSchemesDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(await canvas.findByRole("region", { name: "light" })).backgroundColor).toBe(
      "rgb(255, 255, 255)"
    )
    await expect(getComputedStyle(canvas.getByRole("region", { name: "dark" })).backgroundColor).toBe("rgb(36, 36, 36)")
    await expect(getComputedStyle(canvas.getByRole("region", { name: "dark" })).color).toBe("rgb(201, 201, 201)")
    await expect(getComputedStyle(canvas.getByRole("region", { name: "auto" })).backgroundColor).toBe(
      "rgb(255, 255, 255)"
    )
  }
}

export const PrimaryColor: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [...sx(h, surface.row)],
      [
        ui.ThemeProvider(h, {
          scope: "element",
          primaryColor: "grape",
          children: [ui.Button(h, { children: ["Grape primary"] })]
        }),
        ui.ThemeProvider(h, {
          scope: "element",
          primaryColor: "teal",
          colorScheme: "dark",
          children: [ui.Button(h, { variant: "light", children: ["Teal light, dark"] })]
        })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(await canvas.findByRole("button", { name: "Grape primary" })).backgroundColor).toBe(
      "rgb(190, 75, 219)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Teal light, dark" })).color).toBe(
      "rgb(230, 252, 245)"
    )
  }
}

export const CustomTheme: StoryObj = {
  render: demo(CustomThemeDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: "Round" })
    await expect(getComputedStyle(button).borderTopLeftRadius).toBe("32px")
    await expect(getComputedStyle(canvas.getByRole("region", { name: "Custom" })).fontFamily).toBe("Georgia, serif")
    await expect(getComputedStyle(canvas.getByRole("region", { name: "Custom" })).color).toBe("rgb(10, 20, 30)")
  }
}

export const EveryAccent: StoryObj = {
  render: demo(EveryAccentDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole("button")).toHaveLength(14)
    await expect(getComputedStyle(canvas.getByRole("button", { name: "orange" })).backgroundColor).toBe(
      "rgb(253, 126, 20)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "dark" })).backgroundColor).toBe("rgb(46, 46, 46)")
  }
}

export const Shades: StoryObj = {
  render: story(({ h, ui }) =>
    h.div(
      [...sx(h, surface.row)],
      [
        ui.Button(h, { color: "violet.2", children: ["violet.2"] }),
        ui.Button(h, { color: "violet.12", variant: "outline", children: ["Not a shade"] })
      ]
    )
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(await canvas.findByRole("button", { name: "violet.2" })).backgroundColor).toBe(
      "rgb(208, 191, 255)"
    )
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Not a shade" })).borderTopColor).toBe(
      "rgb(121, 80, 242)"
    )
  }
}

export const DocumentRoot: StoryObj = {
  render: story(
    ({ h, ui, value, set }) =>
      ui.ThemeProvider(h, {
        colorScheme: value("scheme", "light") === "dark" ? "dark" : "light",
        themes: [serifTheme],
        children: [
          ui.Button(h, {
            onClick: set("scheme", value("scheme", "light") === "dark" ? "light" : "dark"),
            children: ["Switch scheme"]
          })
        ]
      }),
    { scope: "element" }
  ),
  play: async ({ canvasElement }) => {
    const root = document.documentElement
    await within(canvasElement).findByRole("button", { name: "Switch scheme" })
    await waitFor(() => expect(getComputedStyle(root).fontFamily).toBe("Georgia, serif"))
    await expect(getComputedStyle(root).colorScheme).toBe("light")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Switch scheme" }))
    await waitFor(() => expect(getComputedStyle(root).colorScheme).toBe("dark"))
    await expect(getComputedStyle(root).backgroundColor).toBe("rgb(36, 36, 36)")
  }
}

export const SwitchingScope: StoryObj = {
  render: story(
    ({ h, ui, value, set }) =>
      ui.ThemeProvider(h, {
        scope: value("scope") === "element" ? "element" : "document",
        colorScheme: "dark",
        styles: { root: surface.padded },
        children: [ui.Button(h, { onClick: set("scope", "element"), children: ["Theme only this box"] })]
      }),
    { scope: "element" }
  ),
  play: async ({ canvasElement }) => {
    const html = document.documentElement
    const button = await within(canvasElement).findByRole("button", { name: "Theme only this box" })
    await waitFor(() => expect(getComputedStyle(html).colorScheme).toBe("dark"))
    await expect(getComputedStyle(present(button.parentElement)).paddingTop).toBe("24px")
    await expect(getComputedStyle(html).paddingTop).toBe("0px")
    await userEvent.click(button)
    await waitFor(() => expect(getComputedStyle(html).colorScheme).not.toBe("dark"))
    await expect(html).not.toHaveAttribute("data-sth-theme")
    await expect(getComputedStyle(present(button.parentElement)).colorScheme).toBe("dark")
  }
}
