import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { people } from "./data.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "size", initial: "md", library: "md" },
    {
      type: "select",
      prop: "orientation",
      options: ["vertical", "horizontal"],
      initial: "vertical",
      library: "vertical"
    },
    { type: "boolean", prop: "withDivider", initial: false, library: false }
  ],
  code: `ui.DataList(h, {
{{props}}  w: "100%",
  maw: 480,
  items: people
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.DataList(h, { w: "100%", maw: 480, items: people, ...props })
