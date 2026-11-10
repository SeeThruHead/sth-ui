import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { align: "center", gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    spacing: "xl",
    children: [
      titled(h, ui, "Labels on the right", charts.FunnelChart(h, { data, size: 200, withLabels: true })),
      titled(
        h,
        ui,
        "Labels inside",
        charts.FunnelChart(h, { data, size: 200, withLabels: true, labelsPosition: "inside" })
      ),
      titled(
        h,
        ui,
        "Labels on the left, formatted",
        charts.FunnelChart(h, {
          data,
          size: 200,
          withLabels: true,
          labelsPosition: "left",
          labelColor: "blue.7",
          valueFormatter: (value) => `${value} users`
        })
      ),
      titled(
        h,
        ui,
        "Legend, segment tooltip, stroke",
        charts.FunnelChart(h, {
          data,
          size: 200,
          withLegend: true,
          tooltipDataSource: "segment",
          strokeColor: "dark.6",
          strokeWidth: 2
        })
      ),
      titled(h, ui, "No tooltip", charts.FunnelChart(h, { data, size: 160, withTooltip: false }))
    ]
  })
