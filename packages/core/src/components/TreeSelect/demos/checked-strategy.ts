import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [
  { id: "strategy-child", mode: "checkbox", checkedStrategy: "child", defaultExpandAll: true },
  { id: "strategy-all", mode: "checkbox", checkedStrategy: "all", defaultExpandAll: true },
  { id: "strategy-parent", mode: "checkbox", checkedStrategy: "parent", defaultExpandAll: true }
])

export const { init, update } = demo

const labels = ["checkedStrategy: child (default)", "checkedStrategy: all", "checkedStrategy: parent"]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    w: "100%",
    maw: 340,
    children: labels.map((label, index) =>
      ui.TreeSelect(h, { ...demo.select(model, index), label, placeholder: "Pick values" })
    )
  })
