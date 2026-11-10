import type { Html, HtmlBuilder } from "foldkit/html"
import { gridCol } from "../Grid.ts"
import type { GridCol } from "../Grid.ts"
import type { Ui } from "../../../Ui.ts"

const cell = <M>(h: HtmlBuilder<M>, ui: Ui, label: string) =>
  ui.Paper(h, { withBorder: true, p: "xs", children: [label] })

const col = <M>(h: HtmlBuilder<M>, ui: Ui, label: string, options: Omit<GridCol, "_tag" | "children">) =>
  gridCol({ ...options, children: [cell(h, ui, label)] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Grid(h, {
    gutter: { base: 5, md: "xl" },
    children: [
      col(h, ui, "First", { span: { base: 12, md: 6 }, order: { base: 2, md: 1 } }),
      col(h, ui, "Second", {
        span: { base: 12, md: 6 },
        order: { base: 1, md: 2 },
        align: { base: "stretch", md: "center" }
      })
    ]
  })
