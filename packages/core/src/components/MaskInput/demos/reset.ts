import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { field, fieldsDemo } from "./fields.ts"
import { Message } from "./fields.ts"
import type { Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["reset"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 340,
    mx: "auto",
    children: [
      ui.MaskInput(h, {
        ...field(model, "reset"),
        label: "Phone number",
        placeholder: "(___) ___-____",
        mask: "(999) 999-9999",
        defaultValue: "5551234567"
      }),
      ui.Group(h, {
        mt: "md",
        children: [ui.Button(h, { onClick: Message.ClickedReset({ name: "reset" }), children: ["Reset"] })]
      })
    ]
  })
