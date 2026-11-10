import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { align: "center", gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    spacing: "xl",
    children: [
      titled(h, ui, "Labels", charts.DonutChart(h, { data, withLabels: true, withLabelsLine: true })),
      titled(
        h,
        ui,
        "Percent labels",
        charts.DonutChart(h, {
          data,
          withLabels: true,
          labelsType: "percent",
          withLabelsLine: false,
          labelColor: "gray.7"
        })
      ),
      titled(h, ui, "Chart label", charts.DonutChart(h, { data, chartLabel: "Users by country" })),
      titled(h, ui, "Padding angle 30", charts.DonutChart(h, { data, paddingAngle: 30 })),
      titled(h, ui, "Size 160, thickness 30", charts.DonutChart(h, { data, size: 160, thickness: 30 })),
      titled(h, ui, "Half donut", charts.DonutChart(h, { data, startAngle: 180, endAngle: 0, withTooltip: false })),
      titled(h, ui, "Stroke", charts.DonutChart(h, { data, strokeColor: "red.5", strokeWidth: 3 })),
      titled(
        h,
        ui,
        "Legend",
        charts.DonutChart(h, {
          data,
          withLegend: true,
          tooltipDataSource: "segment",
          valueFormatter: (value) => `${value} users`
        })
      )
    ]
  })
