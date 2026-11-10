import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["hex"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.MaskInput(h, {
    maw: 340,
    mx: "auto",
    ...field(model, "hex"),
    label: "Hex color",
    placeholder: "#______",
    mask: "\\#hhhhhh",
    tokens: { h: /[0-9a-fA-F]/ }
  })
