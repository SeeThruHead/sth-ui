import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "align", options: ["stretch", "center", "flex-start", "flex-end"], initial: "stretch" },
    {
      type: "select",
      prop: "justify",
      options: ["center", "flex-start", "flex-end", "space-between", "space-around"],
      initial: "center"
    },
    { type: "size", prop: "gap", initial: "md" }
  ],
  code: `ui.Stack(h, {
{{props}}  h: 300,
  w: "100%",
  maw: 540,
  children: buttons(h, ui, ["1", "2", "3"])
})`
})

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Stack(h, { h: 300, w: "100%", maw: 540, children: buttons(h, ui, ["1", "2", "3"]), ...props })
