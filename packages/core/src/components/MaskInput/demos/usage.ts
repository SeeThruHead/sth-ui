import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { entryOf, field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["usage"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "xs",
    children: [
      ui.MaskInput(h, {
        ...field(model, "usage"),
        label: "Phone number",
        mask: "(999) 999-9999",
        placeholder: "(___) ___-____"
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Raw value: ${entryOf(model, "usage").field.raw}`] }),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [entryOf(model, "usage").field.complete ? "Complete" : "Incomplete"]
      })
    ]
  })
