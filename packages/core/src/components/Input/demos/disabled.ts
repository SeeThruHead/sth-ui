import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.Input(h, { disabled: true, placeholder: "Disabled input" }),
      ui.Input(h, { readOnly: true, value: "Read only", attributes: { input: { "aria-label": "Read only" } } }),
      ui.Input(h, {
        component: "textarea",
        multiline: true,
        radius: "xl",
        placeholder: "Multiline, xl radius",
        attributes: { input: { rows: "3" } }
      })
    ]
  })
