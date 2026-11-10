import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const data = [
  { name: "USA", value: 400, color: "indigo.6" },
  { name: "India", value: 300, color: "yellow.6" },
  { name: "Japan", value: 100, color: "teal.6" },
  { name: "Other", value: 200, color: "gray.6" }
]

export const view = <M>(h: HtmlBuilder<M>): Html => charts.FunnelChart(h, { data, mx: "auto" })
