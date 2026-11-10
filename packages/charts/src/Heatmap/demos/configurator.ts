import type { Html, HtmlBuilder } from "foldkit/html"
import { charts } from "../../Charts.ts"
import { data } from "./data.ts"

import type { Ui } from "@sth-ui/core/Ui.ts"
import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "number", prop: "rectSize", initial: 10, min: 6, max: 20 },
    { type: "number", prop: "rectRadius", initial: 2, min: 0, max: 20 },
    { type: "number", prop: "gap", initial: 1, min: 0, max: 5 }
  ],
  code: `charts.Heatmap(h, {
{{props}}  data,
  startDate: "2024-02-16",
  endDate: "2025-02-16"
})`
})

export const view = <M>(h: HtmlBuilder<M>, _ui: Ui, props: Values<typeof configurator.controls>): Html =>
  charts.Heatmap(h, { data, startDate: "2024-02-16", endDate: "2025-02-16", ...props })
