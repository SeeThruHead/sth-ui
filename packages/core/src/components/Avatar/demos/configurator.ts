import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["filled", "light", "outline", "transparent", "white", "default"],
      initial: "filled"
    },
    { type: "size", prop: "radius", initial: "md" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "color", prop: "color", initial: "gray", library: "gray" },
    { type: "string", prop: "src", initial: "images/avatar-1.svg" }
  ],
  code: `ui.Avatar(h, {
{{props}}  alt: "it's me"
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Avatar(h, { alt: "it's me", ...props })
