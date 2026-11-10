import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elements, headings } from "./elements.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Table(h, {
        striped: true,
        highlightOnHover: true,
        withTableBorder: true,
        withColumnBorders: true,
        attributes: { table: { "aria-label": "Striped" } },
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
      }),
      ui.Table(h, {
        striped: "even",
        stripedColor: "blue.0",
        highlightOnHover: true,
        highlightOnHoverColor: "yellow.1",
        withRowBorders: false,
        borderColor: "red.6",
        horizontalSpacing: "xl",
        verticalSpacing: "md",
        captionSide: "top",
        layout: "fixed",
        attributes: { table: { "aria-label": "Even" } },
        children: (t) => [
          t.caption(["Even rows striped"]),
          t.tbody(elements.map((element) => t.tr([t.td([element.name]), t.td([element.symbol], { colSpan: 2 })])))
        ]
      })
    ]
  })
