import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "color", prop: "color", initial: "blue" }],
  code: `charts.RadialBarChart(h, {
  data: data.map((cell) => ({ ...cell, color: {{color}} })),
  dataKey: "value",
  h: 280,
  withLegend: true
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.RadialBarChart(h, {
    data: data.map((cell) => ({ ...cell, color: props.color })),
    dataKey: "value",
    h: 280,
    withLegend: true
  })
