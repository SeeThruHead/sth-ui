import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [{ type: "size", prop: "size", initial: "sm", library: "sm" }],
  code: `ui.Kbd(h, {
{{props}}  children: ["Shift"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Kbd(h, { ...props, children: ["Shift"] })
