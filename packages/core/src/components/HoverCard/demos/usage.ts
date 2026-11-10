import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cardsDemo } from "./cards.ts"
import type { Message, Model } from "./cards.ts"

export { Message, Model } from "./cards.ts"

const demo = cardsDemo({ card: { id: "usage-card" } })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.HoverCard(h, {
        ...demo.card(model, "card"),
        width: 280,
        shadow: "md",
        target: (bind) => ui.Button(h, { bind, children: ["Hover to reveal the card"] }),
        children: [
          ui.Text(h, {
            size: "sm",
            children: [
              "Hover card is revealed when user hovers over target element, it will be hidden once mouse is not over both target and dropdown elements"
            ]
          })
        ]
      })
    ]
  })
