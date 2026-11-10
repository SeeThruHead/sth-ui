import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "number", prop: "iconSize", initial: 38, min: 30, max: 60, step: 1 }
  ],
  code: `ui.Blockquote(h, {
{{props}}  cite: "– Forrest Gump",
  icon: InfoIcon(h, {}),
  mt: "xl",
  maw: 380,
  children: ["Life is like an npm install – you never know what you are going to get."]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Blockquote(h, {
    cite: "– Forrest Gump",
    icon: InfoIcon(h, {}),
    mt: "xl",
    maw: 380,
    children: ["Life is like an npm install – you never know what you are going to get."],
    ...props
  })
