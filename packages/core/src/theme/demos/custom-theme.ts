import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { sx } from "../../styles/StylesApi.ts"
import { colors, font, radius } from "../tokens.stylex.ts"
import type { Ui } from "../../Ui.ts"

const roundTheme = stylex.createTheme(radius, { default: "2rem" })

const serifTheme = stylex.createTheme(font, { body: "Georgia, serif" })

const brandText = stylex.createTheme(colors, { text: "rgb(10, 20, 30)" })

const surface = stylex.create({
  panel: { padding: "16px", color: colors.text, backgroundColor: colors.body, borderRadius: radius.default },
  row: { display: "flex", gap: "8px", flexWrap: "wrap" },
  padded: { padding: "24px" }
})

const panel = <M>(h: HtmlBuilder<M>, label: string, children: ReadonlyArray<Html | string>): Html =>
  h.section([h.AriaLabel(label), ...sx(h, surface.panel)], children)

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.ThemeProvider(h, {
    scope: "element",
    themes: [roundTheme, serifTheme, brandText],
    children: [panel(h, "Custom", [ui.Button(h, { children: ["Round"] })])]
  })
