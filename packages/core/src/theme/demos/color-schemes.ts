import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { sx } from "../../styles/StylesApi.ts"
import { colors, radius } from "../tokens.stylex.ts"
import type { Ui } from "../../Ui.ts"

const surface = stylex.create({
  panel: { padding: "16px", color: colors.text, backgroundColor: colors.body, borderRadius: radius.default },
  row: { display: "flex", gap: "8px", flexWrap: "wrap" },
  padded: { padding: "24px" }
})

const panel = <M>(h: HtmlBuilder<M>, label: string, children: ReadonlyArray<Html | string>): Html =>
  h.section([h.AriaLabel(label), ...sx(h, surface.panel)], children)

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [...sx(h, surface.row)],
    (["light", "dark", "auto"] as const).map((scheme) =>
      ui.ThemeProvider(h, {
        scope: "element",
        colorScheme: scheme,
        children: [panel(h, scheme, [`${scheme} scheme`])]
      })
    )
  )
