import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cardsDemo } from "./cards.ts"
import type { Message, Model } from "./cards.ts"

export { Message, Model } from "./cards.ts"

const demo = cardsDemo({
  opening: { id: "delay-open", openDelay: 1000 },
  closing: { id: "delay-close", closeDelay: 1000 }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.HoverCard(h, {
        ...demo.card(model, "opening"),
        shadow: "md",
        target: (bind) => ui.Button(h, { bind, children: ["1000ms open delay"] }),
        children: [ui.Text(h, { size: "sm", children: ["Opened with 1000ms delay"] })]
      }),
      ui.HoverCard(h, {
        ...demo.card(model, "closing"),
        shadow: "md",
        target: (bind) => ui.Button(h, { bind, children: ["1000ms close delay"] }),
        children: [ui.Text(h, { size: "sm", children: ["Will close with 1000ms delay"] })]
      })
    ]
  })
