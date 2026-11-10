import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Badge(h, { size: "lg", color: "lime", children: ["Default"] }),
      ui.Badge(h, { size: "lg", color: "lime", autoContrast: true, children: ["Auto contrast"] })
    ]
  })
