import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "color", prop: "color", initial: "yellow", library: "yellow" }],
  code: `ui.Mark(h, {
{{props}}  children: ["this chunk"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Text(h, { children: ["Highlight ", ui.Mark(h, { children: ["this chunk"], ...props }), " of the text"] })
