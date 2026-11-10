import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { charts } from "../../Charts.ts"
import type { CurveType } from "../Sparkline.ts"

const curves: ReadonlyArray<CurveType> = ["linear", "natural", "monotone", "step", "stepBefore", "stepAfter", "bump"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: 2,
    children: [
      ...curves.map((curveType) =>
        ui.Stack(h, {
          gap: 4,
          children: [
            ui.Text(h, { size: "sm", children: [curveType] }),
            charts.Sparkline(h, { h: 60, data: [10, 20, 40, 20, 40, 10, 50], curveType, id: `curve-${curveType}` })
          ]
        })
      ),
      ui.Stack(h, {
        gap: 4,
        children: [
          ui.Text(h, { size: "sm", children: ["Missing values, no gradient"] }),
          charts.Sparkline(h, {
            h: 60,
            data: [10, 20, null, 20, 40, null, 50],
            connectNulls: false,
            withGradient: false,
            fillOpacity: 0.2,
            color: "grape"
          })
        ]
      })
    ]
  })
