import type { Html, HtmlBuilder } from "foldkit/html"
import { SlidersHorizontalIcon } from "@sth-ui/icons/icons/SlidersHorizontalIcon.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "light", "outline", "subtle", "transparent", "white"],
      initial: "filled"
    },
    { type: "color", prop: "color", initial: "blue", library: "blue" },
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "size", prop: "radius", initial: "md", library: "md" }
  ],
  code: `ui.ActionIcon(h, {
{{props}}  label: "Settings",
  children: [SlidersHorizontalIcon(h, { size: "70%" })]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.ActionIcon(h, { label: "Settings", children: [SlidersHorizontalIcon(h, { size: "70%" })], ...props })
