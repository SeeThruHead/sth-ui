import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { inputsDemo } from "./inputs.ts"
import type { Message, Model } from "./inputs.ts"

export { Message, Model } from "./inputs.ts"

const demo = inputsDemo([{ value: '{ "a": 1, "B": 2 }' }])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.JsonInput(h, {
    ...demo.input(model, 0),
    id: "disabled-json",
    disabled: true,
    label: "Disabled",
    placeholder: "Disabled",
    w: "100%",
    maw: 400
  })
