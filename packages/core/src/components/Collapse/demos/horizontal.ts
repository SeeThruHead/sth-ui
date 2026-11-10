import type { Html, HtmlBuilder } from "foldkit/html"
import { accent } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"
import { isExpanded, Message, togglesDemo } from "./toggles.ts"
import type { Model } from "./toggles.ts"

export { Message, Model } from "./toggles.ts"

export const { init, update } = togglesDemo(1)

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    h: 240,
    align: "flex-start",
    children: [
      ui.Button(h, {
        onClick: Message.Toggled({ index: 0 }),
        w: "fit-content",
        children: [isExpanded(model, 0) ? "Collapse" : "Expand"]
      }),
      ui.Collapse(h, {
        expanded: isExpanded(model, 0),
        orientation: "horizontal",
        children: [
          ui.Text(h, {
            bg: accent.light,
            p: "xs",
            bdrs: "md",
            w: 200,
            children: [
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            ]
          })
        ]
      })
    ]
  })
