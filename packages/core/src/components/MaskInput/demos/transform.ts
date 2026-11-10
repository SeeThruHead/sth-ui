import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["promo"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 340,
    mx: "auto",
    children: [
      ui.MaskInput(h, {
        ...field(model, "promo"),
        label: "Promo code",
        placeholder: "AAA-9999",
        mask: "AAA-9999",
        transform: (char) => char.toUpperCase(),
        slotChar: "XXX-0000"
      }),
      ui.Text(h, {
        size: "sm",
        mt: "sm",
        c: "dimmed",
        children: ["Type lowercase letters – they will be auto-uppercased"]
      })
    ]
  })
