import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cardsDemo } from "./cards.ts"
import type { Message, Model } from "./cards.ts"

export { Message, Model } from "./cards.ts"

const demo = cardsDemo({ card: { id: "role-card" } })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    children: [
      ui.HoverCard(h, {
        ...demo.card(model, "card"),
        width: 280,
        shadow: "md",
        role: "tooltip",
        target: (bind) =>
          ui.Text(h, {
            td: "underline dotted",
            w: "fit-content",
            attributes: { root: { tabindex: "0" } },
            bind,
            children: ["Hydration"]
          }),
        children: [
          ui.Text(h, {
            size: "sm",
            children: ["Attaching React event handlers to the HTML that was rendered on the server"]
          })
        ]
      })
    ]
  })
