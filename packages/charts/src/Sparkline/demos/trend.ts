import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"

const trendColors = { positive: "teal.6", negative: "red.6", neutral: "gray.5" }

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: "sm",
    children: [
      ui.Text(h, { children: ["Positive trend:"] }),
      charts.Sparkline(h, { w: 200, h: 60, data: [10, 20, 40, 20, 40, 10, 50], trendColors, fillOpacity: 0.2 }),
      ui.Text(h, { mt: "md", children: ["Negative trend:"] }),
      charts.Sparkline(h, { w: 200, h: 60, data: [40, 20, 40, 10, 50, 10, 5], trendColors, fillOpacity: 0.2 }),
      ui.Text(h, { mt: "md", children: ["Neutral trend:"] }),
      charts.Sparkline(h, { w: 200, h: 60, data: [10, 20, 40, 20, 40, 10, 10], trendColors, fillOpacity: 0.2 })
    ]
  })
