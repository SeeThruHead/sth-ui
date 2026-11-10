import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["filled", "light", "outline", "dot", "transparent", "default", "white"],
      initial: "filled",
      library: "filled"
    },
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "xl", library: "xl" }
  ],
  code: `ui.Badge(h, {
{{props}}  children: ["Badge"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Badge(h, { ...props, children: ["Badge"] })
