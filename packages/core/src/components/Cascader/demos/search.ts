import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { cascadersDemo } from "./cascaders.ts"
import type { Message, Model } from "./cascaders.ts"
import { data, withDisabled } from "./data.ts"

export { Message, Model } from "./cascaders.ts"

const demo = cascadersDemo({
  searchable: {
    label: "Searchable",
    placeholder: "Pick location",
    data,
    searchable: true,
    nothingFoundMessage: "Nothing found..."
  },
  flat: {
    label: "Flat list",
    placeholder: "Pick location",
    data: withDisabled,
    withColumns: false,
    withCheckIcon: false
  }
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: ["searchable", "flat"].map((name) => demo.cascader(h, ui, model, name))
  })
