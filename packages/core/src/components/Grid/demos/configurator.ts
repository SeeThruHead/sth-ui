import type { Html, HtmlBuilder } from "foldkit/html"
import { gridCol } from "../Grid.ts"
import { demoTile } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "justify",
      options: ["flex-start", "flex-end", "center", "space-between", "space-around"],
      initial: "flex-start"
    },
    { type: "select", prop: "align", options: ["flex-start", "flex-end", "center"], initial: "flex-start" }
  ],
  code: `ui.Grid(h, {
{{props}}  children: ["1", "2", "3"].map((label) => gridCol({ span: 3, children: [demoTile(h, ui, label)] }))
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, {
    maw: 900,
    children: [
      ui.Grid(h, {
        children: ["1", "2", "3"].map((label) => gridCol({ span: 3, children: [demoTile(h, ui, label)] })),
        ...props
      })
    ]
  })
