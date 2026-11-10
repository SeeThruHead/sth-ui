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
    w: 700,
    children: [
      ui.Grid(h, {
        type: "container",
        children: [
          col(h, ui, "Half from xs", { span: { base: 12, xs: 6, md: 3 } }),
          col(h, ui, "Other half", { span: { base: 12, xs: 6, md: 3 } })
        ]
      })
    ]
  })
