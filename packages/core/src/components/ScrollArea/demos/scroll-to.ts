import type { Html, HtmlBuilder } from "foldkit/html"
import { Message as DemoMessage } from "./areas.ts"
import type { Ui } from "../../../Ui.ts"
import { areaDemo } from "./areas.ts"
import type { Message, Model } from "./areas.ts"
import { content } from "./content.ts"

export { Message, Model } from "./areas.ts"

const demo = areaDemo("scroll-to", { area: {} })

export const { init, update, subscriptions } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.ScrollArea(h, { ...demo.area(model, "area"), w: 300, h: 200, children: content(h, ui) }),
      ui.Group(h, {
        justify: "center",
        children: [
          ui.Button(h, {
            onClick: DemoMessage.ScrolledTo({ name: "area", place: "bottom" }),
            children: ["Scroll to bottom"]
          }),
          ui.Button(h, {
            onClick: DemoMessage.ScrolledTo({ name: "area", place: "center" }),
            children: ["Scroll to center"]
          }),
          ui.Button(h, { onClick: DemoMessage.ScrolledTo({ name: "area", place: "top" }), children: ["Scroll to top"] })
        ]
      })
    ]
  })
