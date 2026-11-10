import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("boundaries", { area: {} })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: [
          ui.Badge(h, { color: "blue", children: [`Top: ${demo.entry(model, "area")?.top ?? 0}`] }),
          ui.Badge(h, { color: "green", children: [`Bottom: ${demo.entry(model, "area")?.bottom ?? 0}`] }),
          ui.Badge(h, { color: "orange", children: [`Left: ${demo.entry(model, "area")?.left ?? 0}`] }),
          ui.Badge(h, { color: "grape", children: [`Right: ${demo.entry(model, "area")?.right ?? 0}`] })
        ]
      }),
      ui.ScrollArea(h, {
        ...demo.area(model, "area"),
        h: 200,
        w: 300,
        children: [
          ui.Box(h, {
            w: 600,
            children: Array.from({ length: 50 }, (_, index) =>
              ui.Text(h, { children: [`Line ${index + 1} - This is a long line that requires horizontal scrolling`] })
            )
          })
        ]
      })
    ]
  })
