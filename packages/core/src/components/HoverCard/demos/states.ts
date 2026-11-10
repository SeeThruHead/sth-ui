import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cardsDemo } from "./cards.ts"
import type { Message, Model } from "./cards.ts"

export { Message, Model } from "./cards.ts"

const demo = cardsDemo({
  arrow: { id: "arrow-card", initiallyOpened: true },
  plain: { id: "plain-card" },
  off: { id: "off-card" }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, {
        size: "sm",
        children: [`Opened ${model["plain"]?.opened ?? 0} times, closed ${model["plain"]?.closed ?? 0} times`]
      }),
      ui.Group(h, {
        children: [
          ui.HoverCard(h, {
            ...demo.card(model, "arrow"),
            withArrow: true,
            position: "top",
            radius: "md",
            withinPortal: false,
            target: (bind) => ui.Button(h, { bind, variant: "default", children: ["With arrow"] }),
            children: [ui.Text(h, { size: "sm", children: ["Starts open, with an arrow"] })]
          }),
          ui.HoverCard(h, {
            ...demo.card(model, "plain"),
            withRoles: false,
            target: (bind) => ui.Button(h, { bind, variant: "light", children: ["No roles"] }),
            children: [ui.Text(h, { size: "sm", children: ["No ARIA roles"] })]
          }),
          ui.HoverCard(h, {
            ...demo.card(model, "off"),
            disabled: true,
            target: (bind) => ui.Button(h, { bind, variant: "outline", children: ["Disabled"] }),
            children: [ui.Text(h, { size: "sm", children: ["Never shown"] })]
          })
        ]
      })
    ]
  })
