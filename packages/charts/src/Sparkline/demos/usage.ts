import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.Sparkline(h, {
    w: 200,
    h: 60,
    data: [10, 20, 40, 20, 40, 10, 50],
    curveType: "linear",
    color: "blue",
    fillOpacity: 0.6,
    strokeWidth: 2
  })
