import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data, series } from "./data.ts"

const gaps = [
  { date: "Mon", Visits: 120 },
  { date: "Tue", Visits: null },
  { date: "Wed", Visits: 180 },
  { date: "Thu", Visits: 150 },
  { date: "Fri", Visits: 210 }
]

const hours = Array.from({ length: 24 }, (_, hour) => ({
  time: `${String(hour).padStart(2, "0")}:00`,
  Load: Math.round(40 + 30 * Math.sin(hour / 3))
}))

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      titled(
        h,
        ui,
        "Legend, units, grid on both axes, reference line",
        charts.LineChart(h, {
          h: 300,
          data,
          dataKey: "date",
          series: [
            ...series.slice(0, 2),
            { name: "Tomatoes", color: "teal.6", label: "Tomatoes (dashed)", strokeDasharray: "5 5" }
          ],
          withLegend: true,
          unit: " kg",
          gridAxis: "xy",
          tickLine: "xy",
          referenceLines: [{ y: 3000, label: "Target", color: "red.6" }, { y: 1000 }],
          xAxisLabel: "Date",
          yAxisLabel: "Amount",
          textColor: "blue",
          gridColor: "gray.4"
        })
      ),
      titled(
        h,
        ui,
        "Gaps, no dots, natural curve, no x axis, formatted values",
        charts.LineChart(h, {
          h: 200,
          data: gaps,
          dataKey: "date",
          series: [{ name: "Visits", color: "grape.6" }],
          connectNulls: false,
          withDots: false,
          curveType: "natural",
          withXAxis: false,
          gridAxis: "none",
          tickLine: "none",
          strokeWidth: 3,
          fillOpacity: 0.8,
          valueFormatter: (value) => new Intl.NumberFormat("en-US").format(value)
        })
      ),
      titled(
        h,
        ui,
        "Many points in a narrow chart",
        charts.LineChart(h, {
          h: 160,
          maw: 320,
          data: hours,
          dataKey: "time",
          series: [{ name: "Load", color: "orange.6" }],
          withDots: false
        })
      ),
      titled(
        h,
        ui,
        "No y axis, no tooltip",
        charts.LineChart(h, {
          h: 160,
          data,
          dataKey: "date",
          series,
          withYAxis: false,
          withTooltip: false,
          gridAxis: "y"
        })
      )
    ]
  })
