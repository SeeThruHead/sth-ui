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
      ui.Toolbar(h, { ariaLabel: "Lime", color: "lime.4", children: editor(model, h) }),
      ui.Toolbar(h, {
        ariaLabel: "Lime with contrast",
        color: "lime.4",
        autoContrast: true,
        children: editor(model, h)
      })
    ]
  })
