import type { Html, HtmlBuilder } from "foldkit/html"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["filled", "light", "outline", "default", "white"],
      initial: "filled",
      library: "filled"
    },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "color", prop: "color", initial: "blue", library: "blue" }
  ],
  code: `ui.ThemeIcon(h, {
{{props}}  ...named("Photos"),
  children: [ImageIcon(h, { size: "70%" })]
})`
})

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.ThemeIcon(h, { ...named("Photos"), children: [ImageIcon(h, { size: "70%" })], ...props })
