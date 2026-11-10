import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { editor, initWith } from "./editor.ts"
import type { Message, Model } from "./editor.ts"

export { Message, Model, update } from "./editor.ts"

export const init = initWith({ formatting: ["bold"], alignment: "left" })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Toolbar(h, { ariaLabel: "Filled", children: editor(model, h) }),
      ui.Toolbar(h, { ariaLabel: "Light", variant: "light", children: editor(model, h) }),
      ui.Toolbar(h, {
        ariaLabel: "Grape, small",
        color: "grape",
        size: "sm",
        radius: "xl",
        children: editor(model, h)
      }),
      ui.Toolbar(h, { ariaLabel: "Vertical", orientation: "vertical", size: "lg", children: editor(model, h) })
    ]
  })
