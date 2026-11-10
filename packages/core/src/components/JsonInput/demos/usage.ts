import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { inputsDemo } from "./inputs.ts"
import type { Message, Model } from "./inputs.ts"

export { Message, Model } from "./inputs.ts"

const demo = inputsDemo([{ formatOnBlur: true }])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.JsonInput(h, {
    ...demo.input(model, 0),
    id: "package-json",
    label: "Your package.json",
    placeholder: "Textarea will autosize to fit the content",
    validationError: "Invalid JSON",
    autosize: true,
    minRows: 4,
    w: "100%",
    maw: 400
  })
