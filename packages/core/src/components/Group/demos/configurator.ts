import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "justify",
      options: ["flex-start", "center", "space-between", "flex-end"],
      initial: "flex-start",
      library: "flex-start"
    },
    { type: "size", prop: "gap", initial: "md", library: "md" },
    { type: "boolean", prop: "grow", initial: false, library: false }
  ],
  code: `ui.Group(h, {
{{props}}  mod: { demo: "usage" },
  children: buttons(h, ui, ["First", "Second", "Third"])
})`
})

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Group(h, { mod: { demo: "usage" }, children: buttons(h, ui, ["First", "Second", "Third"]), ...props })
