import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data, withDisabled } from "./data.ts"

export { Message, Model } from "./cascaders.ts"

const demo = cascadersDemo({
  options: { label: "Disabled options", placeholder: "Pick location", data: withDisabled },
  disabled: { label: "Disabled", placeholder: "Pick location", data, disabled: true },
  error: { label: "With error", placeholder: "Pick location", data, error: "Pick a city", dir: "rtl" }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: ["options", "disabled", "error"].map((name) => demo.cascader(h, ui, model, name))
  })
