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
    id: "loading-json",
    attributes: { input: { "aria-label": "Loading JSON" } },
    placeholder: "Enter JSON",
    autosize: true,
    minRows: 4,
    loading: true,
    w: "100%",
    maw: 400
  })
