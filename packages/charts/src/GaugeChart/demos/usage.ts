import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const view = <M>(h: HtmlBuilder<M>): Html => charts.GaugeChart(h, { value: 72, mx: "auto" })
