import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const cells = <M>(h: HtmlBuilder<M>, ui: Ui, count: number) =>
  Array.from({ length: count }, (_, index) =>
    ui.Paper(h, { withBorder: true, p: "xs", children: [`Cell ${index + 1}`] })
  )

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: 700,
    children: [ui.SimpleGrid(h, { type: "container", cols: { base: 1, xs: 2, md: 4 }, children: cells(h, ui, 4) })]
  })
