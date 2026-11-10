import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elements, headings } from "./elements.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Table(h, {
    captionSide: "bottom",
    children: (t) => {
      const ths = t.tr(headings.map((heading) => t.th([heading])))

      return [
        t.caption(["Some elements from periodic table"]),
        t.thead([ths]),
        t.tbody(
          elements.map((element) =>
            t.tr([
              t.td([String(element.position)]),
              t.td([element.name]),
              t.td([element.symbol]),
              t.td([String(element.mass)])
            ])
          )
        ),
        t.tfoot([ths])
      ]
    }
  })
