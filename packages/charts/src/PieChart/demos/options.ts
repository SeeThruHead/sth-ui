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
      titled(h, ui, "Labels outside", charts.PieChart(h, { data, withLabels: true, withLabelsLine: true })),
      titled(
        h,
        ui,
        "Labels inside",
        charts.PieChart(h, { data, withLabels: true, labelsPosition: "inside", labelsType: "percent", size: 200 })
      ),
      titled(h, ui, "Tooltip on hover", charts.PieChart(h, { data, withTooltip: true, tooltipDataSource: "segment" })),
      titled(h, ui, "Padding angle and stroke", charts.PieChart(h, { data, paddingAngle: 8, strokeWidth: 0 })),
      titled(
        h,
        ui,
        "Half pie with legend",
        charts.PieChart(h, { data, startAngle: 180, endAngle: 0, withLegend: true })
      )
    ]
  })
