import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["time"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.MaskInput(h, {
    maw: 340,
    mx: "auto",
    ...field(model, "time"),
    label: "Time (HH:MM)",
    placeholder: "__:__",
    mask: [/[0-2]/, /\d/, ":", /[0-5]/, /\d/]
  })
