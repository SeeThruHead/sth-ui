import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { treeDemo } from "./trees.ts"
import type { Message, Model } from "./trees.ts"

export { Message, Model } from "./trees.ts"

const demo = treeDemo({ id: "plain-tree" }, { selectOnClick: true })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, { ...demo.tree(model), ariaLabel: "Plain files" })
