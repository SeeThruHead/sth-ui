import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.ScatterChart(h, {
    h: 220,
    data,
    dataKey: { x: "age", y: "BMI" },
    withTooltip: false,
    gridAxis: "xy",
    valueFormatter: (value) => value.toFixed(1)
  })
