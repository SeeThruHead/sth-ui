import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Typography(h, {
    maw: 700,
    children: [
      ui.Title(h, { order: 2, children: ["Components inside"] }),
      ui.Text(h, {
        children: ["Components keep their own styles; Typography only styles the HTML it is given in html."]
      })
    ]
  })
