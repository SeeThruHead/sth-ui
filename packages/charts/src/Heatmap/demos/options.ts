import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

const titled = <M>(h: HtmlBuilder<M>, ui: Ui, title: string, chart: Html) =>
  ui.Stack(h, { gap: "xs", children: [ui.Text(h, { size: "sm", fw: 500, children: [title] }), chart] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      titled(
        h,
        ui,
        "Labels, legend and tooltip",
        charts.Heatmap(h, {
          data,
          startDate: "2024-02-16",
          endDate: "2025-02-16",
          withMonthLabels: true,
          withWeekdayLabels: true,
          withLegend: true,
          withTooltip: true,
          getTooltipLabel: ({ date, value }) => `${date} – ${value === null ? "No" : value} contributions`
        })
      ),
      titled(
        h,
        ui,
        "Split months, labels below, Sunday first, custom colours and domain",
        charts.Heatmap(h, {
          data,
          startDate: "2024-01-01",
          endDate: "2024-06-30",
          splitMonths: true,
          withMonthLabels: true,
          monthLabelsPosition: "bottom",
          withWeekdayLabels: true,
          firstDayOfWeek: 0,
          withOutsideDates: false,
          rectSize: 14,
          gap: 2,
          rectRadius: 7,
          domain: [0, 30],
          colors: ["var(--sth-color-blue-2)", "var(--sth-color-blue-5)", "var(--sth-color-blue-8)"]
        })
      ),
      titled(h, ui, "From a start date only", charts.Heatmap(h, { data, startDate: "2024-01-01", rectSize: 6 }))
    ]
  })
