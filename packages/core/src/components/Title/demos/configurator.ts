import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

const heading =
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure doloremque quas dolorum. Quo amet earum alias consequuntur quam accusamus a quae beatae, odio, quod provident consectetur non repudiandae enim adipisci?"

export const configurator = defineConfigurator({
  controls: [{ type: "number", prop: "lineClamp", initial: 2, min: 1, max: 8 }],
  code: `ui.Title(h, {
  order: 2,
{{props}}  children: ["Lorem ipsum dolor sit amet..."]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Box(h, { maw: 400, children: [ui.Title(h, { order: 2, ...props, children: [heading] })] })
