import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

export const view = <M>(h: HtmlBuilder<M>): Html => charts.CandlestickChart(h, { h: 300, data, dataKey: "date" })
