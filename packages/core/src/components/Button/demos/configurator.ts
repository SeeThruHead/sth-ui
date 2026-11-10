import type { Html, HtmlBuilder } from "foldkit/html"
import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"
import type { Ui } from "../../../Ui.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "light", "outline", "subtle", "transparent", "white"],
      initial: "filled",
      library: "filled"
    },
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" }
  ],
  code: `ui.Button(h, {
{{props}}  children: ["Button"]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Button(h, { ...props, children: ["Button"] })
