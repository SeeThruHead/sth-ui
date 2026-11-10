import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data } from "./data.ts"

export { Message, Model } from "./cascaders.ts"

const demo = cascadersDemo({ usage: { label: "Location", placeholder: "Pick location", data } })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, { maw: 340, mx: "auto", children: [demo.cascader(h, ui, model, "usage")] })
