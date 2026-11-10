import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 560,
    children: [
      ui.Alert(h, { title: "Only a title", color: "lime.4", variant: "filled", autoContrast: true }),
      ui.Alert(h, {
        id: "message-only",
        role: "status",
        color: "grape",
        children: ["Only a message"]
      }),
      ui.Alert(h, { color: "teal", variant: "outline", withCloseButton: true, children: ["Close button, no label"] })
    ]
  })
