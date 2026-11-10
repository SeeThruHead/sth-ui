import type { Html, HtmlBuilder } from "foldkit/html"
import { gridCol } from "../Grid.ts"
import { demoTile } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 900,
    children: [
      ui.Grid(h, {
        children: ["1", "2", "3"].map((label) => gridCol({ span: 4, children: [demoTile(h, ui, label)] }))
      })
    ]
  })
