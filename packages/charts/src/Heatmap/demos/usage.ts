import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

export const view = <M>(h: HtmlBuilder<M>): Html =>
  charts.Heatmap(h, { data, startDate: "2024-02-16", endDate: "2025-02-16" })
