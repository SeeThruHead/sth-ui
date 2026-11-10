import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { steps } from "./steps.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "type", options: ["unordered", "ordered"], initial: "unordered", library: "unordered" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "boolean", prop: "withPadding", initial: false, library: false }
  ],
  code: `ui.List(h, {
{{props}}  items: steps
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.List(h, { items: steps, ...props })
