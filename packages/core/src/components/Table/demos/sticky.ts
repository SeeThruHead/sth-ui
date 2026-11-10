import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elementsLong, headings } from "./elements.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.TableScrollContainer(h, {
    minWidth: 500,
    maxHeight: 300,
    children: [
      ui.Table(h, {
        stickyHeader: true,
        stickyHeaderOffset: 0,
        withColumnBorders: true,
        withTableBorder: true,
        children: (t) => [
          t.thead([t.tr(headings.map((heading) => t.th([heading])))]),
          t.tbody(
            elementsLong.map((element) =>
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
    ]
  })
