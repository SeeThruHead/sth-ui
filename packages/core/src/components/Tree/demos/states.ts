import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { treeDemo } from "./trees.ts"
import type { Message, Model } from "./trees.ts"

export { Message, Model } from "./trees.ts"

const demo = treeDemo(
  { id: "states-tree", multiple: true, initialSelectedState: ["package.json"] },
  {
    selectOnClick: true,
    allowRangeSelection: false,
    clearSelectionOnOutsideClick: true,
    checkOnSpace: true,
    expandOnSpace: false,
    keepMounted: true,
    levelOffset: "xl"
  }
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Tree(h, { ...demo.tree(model), ariaLabel: "Many files" }),
      ui.Text(h, { size: "sm", children: [`Selected: ${model.tree.selected.join(", ") || "nothing"}`] }),
      ui.Text(h, { size: "sm", children: [`Checked: ${model.tree.checked.join(", ") || "nothing"}`] })
    ]
  })
