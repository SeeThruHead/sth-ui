import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { accent, fontWeight } from "../../theme/tokens.stylex.ts"
import type { Ui } from "../../Ui.ts"

const parts = stylex.create({
  root: { borderStyle: "dashed", borderColor: accent.filled, borderWidth: "2px" },
  label: { fontWeight: fontWeight.regular, letterSpacing: "0.08em" },
  section: { color: "rgb(250, 82, 82)" },
  inner: { gap: "4px" }
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Button(h, { children: ["From the theme"] }),
      ui.Button(h, { styles: { label: parts.label }, variant: "light", children: ["Props win"] })
    ]
  )
