import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const cells = <M>(h: HtmlBuilder<M>, ui: Ui, count: number) =>
  Array.from({ length: count }, (_, index) =>
    ui.Paper(h, { withBorder: true, p: "xs", children: [`Cell ${index + 1}`] })
  )

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 2, lg: 5 },
    spacing: { base: 10, sm: "xl" },
    children: cells(h, ui, 5)
  })
