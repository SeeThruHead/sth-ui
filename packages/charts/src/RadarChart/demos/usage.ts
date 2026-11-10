import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  { product: "Apples", sales: 120 },
  { product: "Oranges", sales: 98 },
  { product: "Tomatoes", sales: 86 },
  { product: "Grapes", sales: 99 },
  { product: "Bananas", sales: 85 },
  { product: "Lemons", sales: 65 }
]

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.RadarChart(h, {
    h: 300,
    data,
    dataKey: "product",
    withPolarRadiusAxis: true,
    series: [{ name: "sales", color: "blue.4", opacity: 0.2 }]
  })
