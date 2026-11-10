import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "color", prop: "strokeColor", initial: "blue" }
  ],
  code: `charts.RadarChart(h, {
  h: 300,
  data,
  dataKey: "product",
  withPolarRadiusAxis: true,
  series: [{ name: "sales", color: {{color}}, strokeColor: {{strokeColor}}, opacity: 0.2 }]
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.RadarChart(h, {
    h: 300,
    data,
    dataKey: "product",
    withPolarRadiusAxis: true,
    series: [{ name: "sales", color: props.color, strokeColor: props.strokeColor, opacity: 0.2 }]
  })
