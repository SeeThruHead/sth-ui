import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data, series } from "./data.ts"

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

const changes = [
  { month: "Q1", Profit: 300 },
  { month: "Q2", Profit: -120 },
  { month: "Q3", Profit: 220 },
  { month: "Q4", Profit: null }
]

const dollars = (value: number) => `$${value}`

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      titled(
        h,
        ui,
        "Stacked with legend",
        charts.BarChart(h, { h: 260, data, dataKey: "month", series, type: "stacked", withLegend: true })
      ),
      titled(
        h,
        ui,
        "Percent",
        charts.BarChart(h, { h: 260, data, dataKey: "month", series, type: "percent", cursorFill: "violet.1" })
      ),
      titled(
        h,
        ui,
        "Negative values, bar width, opacity",
        charts.BarChart(h, {
          h: 200,
          data: changes,
          dataKey: "month",
          series: [{ name: "Profit", color: "teal.6" }],
          maxBarWidth: 30,
          fillOpacity: 0.6,
          valueFormatter: dollars
        })
      )
    ]
  })
