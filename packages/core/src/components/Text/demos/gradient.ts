import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Text(h, { variant: "gradient", size: "xl", fw: 900, children: ["Default gradient"] }),
      ui.Text(h, {
        variant: "gradient",
        gradient: { from: "grape", to: "orange", deg: 90 },
        size: "xl",
        fw: 900,
        children: ["Grape to orange"]
      })
    ]
  })
