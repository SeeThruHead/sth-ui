import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.CompositeChart(h, {
    h: 260,
    data,
    dataKey: "date",
    withLegend: true,
    connectNulls: false,
    series: [
      { name: "Apples", color: "indigo.6", type: "line", strokeDasharray: "5 5" },
      { name: "Oranges", color: "teal.6", type: "area" }
    ]
  })
