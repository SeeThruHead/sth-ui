import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ColorSwatch(h, { color: "rgba(255, 255, 255, 0.7)", ariaLabel: "With shadow" }),
      ui.ColorSwatch(h, { color: "rgba(255, 255, 255, 0.7)", withShadow: false, ariaLabel: "Without shadow" })
    ]
  })
