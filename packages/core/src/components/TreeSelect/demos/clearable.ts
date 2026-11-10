import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [
  { id: "clearable-select", value: ["iphone"], defaultExpandedValues: ["electronics", "phones"] }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TreeSelect(h, {
    ...demo.select(model, 0),
    label: "Your favorite item",
    placeholder: "Pick value",
    clearable: true,
    w: "100%",
    maw: 340
  })
