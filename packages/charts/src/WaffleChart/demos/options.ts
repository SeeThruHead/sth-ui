import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./usage.ts"

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    spacing: "xl",
    children: [
      titled(
        h,
        ui,
        "Total, round cells, tooltip, legend on the right",
        charts.WaffleChart(h, {
          data,
          total: 150,
          rows: 6,
          columns: 15,
          cellRadius: 4,
          withTooltip: true,
          legendPosition: "right",
          getTooltipLabel: (cell) => `${cell.name}: ${cell.count} cells`
        })
      ),
      titled(
        h,
        ui,
        "Bottom to top, sized, legend on top",
        charts.WaffleChart(h, {
          data,
          size: 120,
          fillDirection: "bottom-to-top",
          withTooltip: true,
          legendPosition: "top",
          emptyColor: "gray.3"
        })
      ),
      titled(
        h,
        ui,
        "Right to left, no legend, named",
        charts.WaffleChart(h, {
          data,
          fillDirection: "right-to-left",
          withLegend: false,
          gap: 0,
          ariaLabel: "Build results"
        })
      ),
      titled(
        h,
        ui,
        "Top to bottom, legend on the left, empty",
        charts.WaffleChart(h, { data: [], rows: 3, columns: 3, fillDirection: "top-to-bottom", legendPosition: "left" })
      )
    ]
  })
