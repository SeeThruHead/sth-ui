import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

import type { Ui } from "@sth-ui/core/Ui.ts"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "number", prop: "gap", initial: 1, min: 0, max: 10, step: 1 }],
  code: `charts.SunburstChart(h, {
{{props}}  data,
  mx: "auto"
})`
})

export const data = [
  {
    name: "Fruits",
    color: "red.6",
    children: [
      { name: "Apples", value: 30, color: "red.4" },
      { name: "Pears", value: 10 }
    ]
  },
  {
    name: "Vegetables",
    color: "green.6",
    children: [
      { name: "Carrots", value: 20 },
      {
        name: "Peas",
        color: "teal.6",
        children: [
          { name: "Garden", value: 15 },
          { name: "Snow", value: 5 }
        ]
      }
    ]
  }
]

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.SunburstChart(h, { data, mx: "auto", ...props })
