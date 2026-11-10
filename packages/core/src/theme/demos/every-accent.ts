import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { sx } from "../../styles/StylesApi.ts"
import { isAccentName } from "../accent.ts"
import { accents } from "../accents.ts"
import { colors, radius } from "../tokens.stylex.ts"
import type { Ui } from "../../Ui.ts"

const surface = stylex.create({
  panel: { padding: "16px", color: colors.text, backgroundColor: colors.body, borderRadius: radius.default },
  row: { display: "flex", gap: "8px", flexWrap: "wrap" },
  padded: { padding: "24px" }
})

const accentNames = Object.keys(accents).filter(isAccentName)

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [...sx(h, surface.row)],
    accentNames.map((color) => ui.Button(h, { color, children: [color] }))
  )
