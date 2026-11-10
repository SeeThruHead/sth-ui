import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "boolean", prop: "withRemoveButton", initial: false, library: false }
  ],
  code: `ui.Pill(h, {
{{props}}  children: ["React"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Pill(h, { children: ["React"], ...props })
