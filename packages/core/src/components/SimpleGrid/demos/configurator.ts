import type { Html, HtmlBuilder } from "foldkit/html"
import { demoTile } from "../../../stories/demo.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "number", prop: "cols", initial: 3, min: 1, max: 6, step: 1 },
    { type: "size", prop: "spacing", initial: "md", library: "md" },
    { type: "size", prop: "verticalSpacing", initial: "md", library: "md" }
  ],
  code: `ui.SimpleGrid(h, {
{{props}}  children: ["1", "2", "3", "4", "5"].map((label) => demoTile(h, ui, label))
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.SimpleGrid(h, { children: ["1", "2", "3", "4", "5"].map((label) => demoTile(h, ui, label)), ...props })
