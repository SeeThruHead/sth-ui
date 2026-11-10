import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { entryOf, field, fieldsDemo } from "./fields.ts"
import type { Message, Model } from "./fields.ts"

export { Message, Model } from "./fields.ts"

export const { init, update } = fieldsDemo(["extension", "escaped", "always"])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      ui.MaskInput(h, {
        ...field(model, "extension"),
        label: "Phone with optional extension",
        mask: "(999) 999-9999? x9999",
        description:
          entryOf(model, "extension").completed === ""
            ? "Not complete yet"
            : `Completed: ${entryOf(model, "extension").completed}`
      }),
      ui.MaskInput(h, { ...field(model, "escaped"), label: "Escaped token", mask: "\\A999", autoClear: true }),
      ui.MaskInput(h, {
        ...field(model, "always"),
        label: "Always shows the mask",
        mask: "99/99/9999",
        slotChar: "mm/dd/yyyy",
        alwaysShowMask: true,
        showMaskOnFocus: false
      })
    ]
  })
