import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.Burger(h, { size: "xl", lineSize: 2, label: "Thin lines" }),
      ui.Burger(h, { size: "xl", lineSize: 6, color: "blue", label: "Thick blue lines" }),
      ui.Burger(h, { color: "red.7", transitionDuration: 0, transitionTimingFunction: "linear", label: "Red" })
    ]
  })
