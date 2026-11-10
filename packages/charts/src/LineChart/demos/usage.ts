import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data, series } from "./data.ts"

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.LineChart(h, { h: 300, data, dataKey: "date", series, curveType: "linear" })
