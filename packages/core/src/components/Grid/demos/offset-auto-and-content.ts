import type { Html, HtmlBuilder } from "foldkit/html"
import { gridCol } from "../Grid.ts"
import type { GridCol } from "../Grid.ts"
import type { Ui } from "../../../Ui.ts"

const cell = <M>(h: HtmlBuilder<M>, ui: Ui, label: string) =>
  ui.Paper(h, { withBorder: true, p: "xs", children: [label] })

const col = <M>(h: HtmlBuilder<M>, ui: Ui, label: string, options: Omit<GridCol, "_tag" | "children">) =>
  gridCol({ ...options, children: [cell(h, ui, label)] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 900,
    children: [
      ui.Grid(h, {
        gutter: 0,
        children: [col(h, ui, "Offset 3, span 3", { span: 3, offset: 3 }), col(h, ui, "Span 6", { span: 6 })]
      }),
      ui.Grid(h, {
        mt: "md",
        gutter: "xs",
        children: [
          col(h, ui, "Content", { span: "content" }),
          col(h, ui, "Auto fills the rest", { span: "auto" }),
          col(h, ui, "Span 2", { span: 2 })
        ]
      })
    ]
  })
