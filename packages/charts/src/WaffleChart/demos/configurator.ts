import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

import type { Ui } from "@sth-ui/core/Ui.ts"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "fillDirection",
      options: ["left-to-right", "right-to-left", "top-to-bottom", "bottom-to-top"],
      initial: "left-to-right",
      library: "left-to-right"
    }
  ],
  code: `charts.WaffleChart(h, {
{{props}}  data
})`
})

export const data = [
  { name: "Completed", value: 68, color: "teal.6" },
  { name: "In progress", value: 22, color: "yellow.6" },
  { name: "Failed", value: 10, color: "red.6" }
]

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.WaffleChart(h, { data, ...props })
