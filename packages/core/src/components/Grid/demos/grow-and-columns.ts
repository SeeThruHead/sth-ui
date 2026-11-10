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
        grow: true,
        gutter: 0,
        children: [
          col(h, ui, "A", { span: 4 }),
          col(h, ui, "B", { span: 4 }),
          col(h, ui, "C", { span: 4 }),
          col(h, ui, "Grown", { span: 4 })
        ]
      }),
      ui.Grid(h, { columns: 24, gutter: 0, mt: "md", children: [col(h, ui, "Span 6 of 24", { span: 6 })] }),
      ui.Grid(h, { gutter: 0, mt: "md", children: [col(h, ui, "Full width by default", { offset: 0 })] }),
      ui.Grid(h, {
        justify: "center",
        align: "flex-end",
        overflow: "hidden",
        mt: "md",
        children: [col(h, ui, "Centred", { span: 3 })]
      })
    ]
  })
