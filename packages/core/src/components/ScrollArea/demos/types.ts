import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("types", {
  auto: { type: "auto" },
  always: { type: "always" },
  scroll: { type: "scroll", scrollHideDelay: 300 },
  never: { type: "never" }
})

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 2 },
    w: "100%",
    children: (["auto", "always", "scroll", "never"] as const).map((name) =>
      ui.Stack(h, {
        gap: "xs",
        children: [
          ui.Text(h, { fw: 500, children: [`type="${name}"`] }),
          ui.ScrollArea(h, { ...demo.area(model, name), h: 150, children: content(h, ui) })
        ]
      })
    )
  })
