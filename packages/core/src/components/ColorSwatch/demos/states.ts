import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ColorSwatch(h, { color: "blue.6", size: 40, radius: "sm", ariaLabel: "Blue square" }),
      ui.ColorSwatch(h, { color: "red", size: "1.25rem", component: "span", ariaLabel: "Small red" }),
      ui.ColorSwatch(h, { color: "green" })
    ]
  })
