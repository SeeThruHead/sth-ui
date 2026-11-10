import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elements, headings } from "./elements.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Table(h, {
    children: (t) => [
      t.thead([t.tr(headings.map((heading) => t.th([heading])))]),
      t.tbody(
        elements.map((element) =>
          t.tr([
            t.td([String(element.position)]),
            t.td([element.name]),
            t.td([element.symbol]),
            t.td([String(element.mass)])
          ])
        )
      )
    ]
  })
