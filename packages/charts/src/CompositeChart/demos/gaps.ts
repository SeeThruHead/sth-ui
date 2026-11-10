import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const data = [
  { quarter: "Q1", Revenue: 120, Growth: 40 },
  { quarter: "Q2", Revenue: null, Growth: 55 },
  { quarter: "Q3", Revenue: 160, Growth: null },
  { quarter: "Q4", Revenue: 190, Growth: 70 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.CompositeChart(h, {
    h: 220,
    data,
    dataKey: "quarter",
    connectNulls: false,
    series: [
      { name: "Revenue", color: "blue.6", type: "bar" },
      { name: "Growth", color: "orange.6", type: "line" }
    ]
  })
