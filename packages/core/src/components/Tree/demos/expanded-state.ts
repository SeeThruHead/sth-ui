import type { Html, HtmlBuilder } from "foldkit/html"
import { getTreeExpandedState } from "../Tree.ts"
import { data } from "./data.ts"
import type { Ui } from "../../../Ui.ts"
import { leaf, treeDemo } from "./trees.ts"
import type { Message, Model } from "./trees.ts"

export { Message, Model } from "./trees.ts"

const demo = treeDemo({
  id: "expanded-tree",
  initialExpandedState: getTreeExpandedState(data, ["src", "src/components"])
})

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, { ...demo.tree(model), ariaLabel: "Files", withLines: true, renderNode: leaf(h, ui) })
