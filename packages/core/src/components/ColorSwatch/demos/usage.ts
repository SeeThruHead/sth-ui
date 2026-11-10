import type { Html, HtmlBuilder } from "foldkit/html"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ColorSwatch(h, { color: "#009790", ariaLabel: "Teal" }),
      ui.ColorSwatch(h, { color: "rgba(234, 22, 174, 0.5)", ariaLabel: "Translucent pink" }),
      ui.ColorSwatch(h, { color: palette.orange5, ariaLabel: "Orange" })
    ]
  })
