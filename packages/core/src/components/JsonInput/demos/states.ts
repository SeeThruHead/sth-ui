import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { inputsDemo } from "./inputs.ts"
import type { Message, Model } from "./inputs.ts"

export { Message, Model } from "./inputs.ts"

const padded = stylex.create({ input: { paddingTop: "8px" } })

const demo = inputsDemo([
  { formatOnBlur: true, indentSpaces: 4 },
  { formatOnBlur: true, readOnly: true, value: '{"kept":true}' },
  { value: "{" }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 400,
    children: [
      ui.JsonInput(h, { ...demo.input(model, 0), id: "four-spaces", label: "Four spaces", autosize: true }),
      ui.JsonInput(h, { ...demo.input(model, 1), id: "read-only-json", label: "Read only" }),
      ui.JsonInput(h, { ...demo.input(model, 2), id: "invalid-json", label: "Starts invalid", error: "Unused" }),
      ui.JsonInput(h, {
        ...demo.input(model, 0),
        id: "with-error",
        label: "With error",
        error: "Server rejected it",
        styles: { input: padded.input }
      })
    ]
  })
