import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

const data = [
  { product: "Apples", "Sales January": 120, "Sales February": 100 },
  { product: "Oranges", "Sales January": 98, "Sales February": 90 },
  { product: "Tomatoes", "Sales January": 86, "Sales February": 70 },
  { product: "Grapes", "Sales January": 99, "Sales February": 80 },
  { product: "Bananas", "Sales January": 85, "Sales February": 120 },
  { product: "Lemons", "Sales January": 65, "Sales February": 150 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.RadarChart(h, {
    h: 340,
    data,
    dataKey: "product",
    withLegend: true,
    withTooltip: true,
    withDots: true,
    gridColor: "gray.4",
    textColor: "gray.9",
    series: [
      { name: "Sales January", color: "lime.4", opacity: 0.1 },
      { name: "Sales February", color: "cyan.4", strokeColor: "cyan.8", opacity: 0.1, label: "February" }
    ]
  })
