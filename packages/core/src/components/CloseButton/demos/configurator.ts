import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "select", prop: "variant", options: ["transparent", "subtle"], initial: "subtle", library: "subtle" }
  ],
  code: `ui.CloseButton(h, {
{{props}}})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.CloseButton(h, { ...props })
