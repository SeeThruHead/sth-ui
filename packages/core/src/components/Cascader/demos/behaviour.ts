import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data } from "./data.ts"

export { Message, Model } from "./cascaders.ts"

const demo = cascadersDemo({
  parents: { label: "Change on select", placeholder: "Any level", data, changeOnSelect: true },
  open: { label: "Stays open", placeholder: "Pick location", data, closeOnSelect: false },
  locked: { label: "Cannot deselect", data, allowDeselect: false, initial: ["asia", "jp", "tokyo"] },
  hover: { label: "Expands on hover", placeholder: "Pick location", data, expandTrigger: "hover" }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: ["parents", "open", "locked", "hover"].map((name) => demo.cascader(h, ui, model, name))
  })
