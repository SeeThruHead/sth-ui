import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { bulbasaur } from "./lorem.ts"
import { isExpanded, Message, togglesDemo } from "./toggles.ts"
import type { Model } from "./toggles.ts"

export { Message, Model } from "./toggles.ts"

export const { init, update } = togglesDemo(1)

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.Group(h, {
        justify: "center",
        mb: 5,
        children: [
          ui.Button(h, { onClick: Message.Toggled({ index: 0 }), children: ["Toggle with linear transition"] })
        ]
      }),
      ui.Collapse(h, {
        expanded: isExpanded(model, 0),
        transitionDuration: 1000,
        transitionTimingFunction: "linear",
        children: [ui.Text(h, { children: [bulbasaur] })]
      })
    ]
  })
