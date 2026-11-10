import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["filled", "light", "outline", "transparent", "white", "default"],
      initial: "light"
    },
    { type: "color", prop: "color", initial: "blue" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "boolean", prop: "withCloseButton", initial: false, library: false },
    { type: "string", prop: "title", initial: "Alert title" },
    {
      type: "string",
      prop: "children",
      initial:
        "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe."
    }
  ],
  code: `ui.Alert(h, {
{{props}}  id: "usage-alert",
  icon: InfoIcon(h),
  w: "100%",
  maw: 560
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.Alert(h, { id: "usage-alert", icon: InfoIcon(h), w: "100%", maw: 560, ...props, children: [props.children] })
