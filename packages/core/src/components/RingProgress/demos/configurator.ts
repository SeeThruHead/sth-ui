import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "number", prop: "size", initial: 120, min: 60, max: 400, step: 10 },
    { type: "number", prop: "thickness", initial: 12, min: 1, max: 40, step: 1 },
    { type: "boolean", prop: "roundCaps", initial: true, library: false }
  ],
  code: `ui.RingProgress(h, {
{{props}}  label: ui.Text(h, { size: "xs", ta: "center", children: ["Application data usage"] }),
  sections: [
      { value: 40, color: "cyan" },
      { value: 15, color: "orange" },
      { value: 15, color: "grape" }
    ]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.RingProgress(h, {
    label: ui.Text(h, { size: "xs", ta: "center", children: ["Application data usage"] }),
    sections: [
      { value: 40, color: "cyan" },
      { value: 15, color: "orange" },
      { value: 15, color: "grape" }
    ],
    ...props
  })
