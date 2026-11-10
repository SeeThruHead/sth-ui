import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const cells = <M>(h: HtmlBuilder<M>, ui: Ui, count: number) =>
  Array.from({ length: count }, (_, index) =>
    ui.Paper(h, { withBorder: true, p: "xs", children: [`Cell ${index + 1}`] })
  )

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: 640,
    children: [
      ui.SimpleGrid(h, { minColWidth: 200, children: cells(h, ui, 2) }),
      ui.SimpleGrid(h, {
        minColWidth: "200px",
        autoFlow: "auto-fit",
        autoRows: "60px",
        mt: "md",
        children: cells(h, ui, 2)
      })
    ]
  })
