import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "select", prop: "type", options: ["oval", "bars", "dots"], initial: "oval", library: "oval" }
  ],
  code: `ui.Loader(h, {
{{props}}})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Loader(h, { ...props })
