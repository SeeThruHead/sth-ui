import type { Html, HtmlBuilder } from "foldkit/html"
import { demoTile } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 3,
    spacing: "lg",
    verticalSpacing: "xs",
    children: ["1", "2", "3", "4", "5"].map((label) => demoTile(h, ui, label))
  })
