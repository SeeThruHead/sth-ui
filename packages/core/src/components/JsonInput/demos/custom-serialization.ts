import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { inputsDemo } from "./inputs.ts"
import type { Message, Model } from "./inputs.ts"

export { Message, Model } from "./inputs.ts"

const lenient = (text: string): unknown => JSON.parse(text.replaceAll("'", '"'))

const sorted = (value: unknown, _replacer: null, space: number): string =>
  JSON.stringify(
    value,
    (_key, inner: unknown) =>
      inner !== null && typeof inner === "object" && !Array.isArray(inner)
        ? Object.fromEntries(Object.entries(inner).toSorted(([a], [b]) => a.localeCompare(b)))
        : inner,
    space
  )

const demo = inputsDemo([
  { formatOnBlur: true, deserialize: lenient, serialize: sorted, value: "{'zeta': 1, 'alpha': 2}" }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.JsonInput(h, {
    ...demo.input(model, 0),
    id: "lenient-json",
    label: "Single quotes allowed",
    description: "Formats to JSON with sorted keys on blur",
    autosize: true,
    minRows: 4,
    w: "100%",
    maw: 400
  })
