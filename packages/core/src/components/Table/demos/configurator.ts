import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { elements, headings } from "./elements.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "boolean", prop: "striped", initial: false, library: false },
    { type: "boolean", prop: "highlightOnHover", initial: false, library: false },
    { type: "boolean", prop: "withTableBorder", initial: false, library: false },
    { type: "boolean", prop: "withColumnBorders", initial: false, library: false },
    { type: "boolean", prop: "withRowBorders", initial: true, library: true }
  ],
  code: `ui.Table(h, {
{{props}}  children: (t) => [
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
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
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
    ],
    ...props
  })
