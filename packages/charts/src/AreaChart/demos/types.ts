import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data, series } from "./data.ts"

const gaps = [
  { date: "Mon", Visits: 120 },
  { date: "Tue", Visits: null },
  { date: "Wed", Visits: 180 },
  { date: "Thu", Visits: -40 },
  { date: "Fri", Visits: 210 }
]

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      titled(
        h,
        ui,
        "Stacked",
        charts.AreaChart(h, { h: 260, data, dataKey: "date", series, type: "stacked", withLegend: true })
      ),
      titled(
        h,
        ui,
        "Percent",
        charts.AreaChart(h, { h: 260, data, dataKey: "date", series, type: "percent", id: "percent" })
      ),
      titled(
        h,
        ui,
        "Gaps, negative values, flat fill, dashed series",
        charts.AreaChart(h, {
          h: 200,
          data: gaps,
          dataKey: "date",
          series: [{ name: "Visits", color: "grape.6", strokeDasharray: "4 2" }],
          connectNulls: false,
          withGradient: false,
          fillOpacity: 0.4,
          withDots: false,
          strokeWidth: 1
        })
      )
    ]
  })
