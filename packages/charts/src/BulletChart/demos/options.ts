import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import { ranges } from "./usage.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "xl",
    children: [
      charts.BulletChart(h, {
        value: 180,
        target: 400,
        ranges,
        label: "Formatted, tooltip",
        withTooltip: true,
        valueFormatter: (value) => `$${value}`
      }),
      charts.BulletChart(h, {
        value: 120,
        ranges,
        withTooltip: true,
        size: 20,
        barSize: 8,
        getTooltipLabel: ({ value }) => `${value} sold`
      }),
      ui.Group(h, {
        h: 220,
        children: [
          charts.BulletChart(h, {
            value: 200,
            target: 260,
            ranges,
            orientation: "vertical",
            label: "Vertical",
            targetColor: "blue.6",
            targetRatio: 0.9,
            targetSize: "4px"
          }),
          charts.BulletChart(h, { value: 50, ranges: [], orientation: "vertical" })
        ]
      })
    ]
  })
