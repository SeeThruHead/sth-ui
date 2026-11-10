import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("scroll-position", { area: {} })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.ScrollArea(h, {
        ...demo.area(model, "area"),
        w: 300,
        h: 200,
        children: [ui.Box(h, { w: 600, children: content(h, ui) })]
      }),
      ui.Text(h, {
        children: [
          "Scroll position: ",
          h.code(
            [],
            [
              `{ x: ${Math.round(demo.entry(model, "area")?.x ?? 0)}, y: ${Math.round(demo.entry(model, "area")?.y ?? 0)} }`
            ]
          )
        ]
      })
    ]
  })
