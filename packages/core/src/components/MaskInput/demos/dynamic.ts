import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["card"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.MaskInput(h, {
    maw: 340,
    mx: "auto",
    ...field(model, "card"),
    label: "Credit card",
    placeholder: "____ ____ ____ ____",
    mask: "9999 9999 9999 9999",
    modify: (value) => (/^3[47]/.test(value) ? { mask: "9999 999999 99999" } : undefined)
  })
