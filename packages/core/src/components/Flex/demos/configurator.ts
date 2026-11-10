import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "gap", initial: "md" },
    { type: "select", prop: "justify", options: ["flex-start", "center", "flex-end"], initial: "flex-start" },
    { type: "select", prop: "align", options: ["flex-start", "center", "flex-end"], initial: "flex-start" },
    { type: "select", prop: "direction", options: ["row", "column", "row-reverse", "column-reverse"], initial: "row" },
    { type: "select", prop: "wrap", options: ["wrap", "nowrap", "wrap-reverse"], initial: "wrap" }
  ],
  code: `ui.Flex(h, {
{{props}}  mih: 50,
  bg: "rgba(0, 0, 0, .3)",
  children: ["Button 1", "Button 2", "Button 3"].map((label) => ui.Button(h, { children: [label] }))
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Flex(h, {
    mih: 50,
    bg: "rgba(0, 0, 0, .3)",
    children: ["Button 1", "Button 2", "Button 3"].map((label) => ui.Button(h, { children: [label] })),
    ...props
  })
