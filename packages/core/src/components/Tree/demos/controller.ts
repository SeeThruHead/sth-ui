import type { Html, HtmlBuilder } from "foldkit/html"
import { Message as DemoMessage } from "./trees.ts"
import type { Ui } from "../../../Ui.ts"
import { leaf, treeDemo } from "./trees.ts"
import type { Message, Model } from "./trees.ts"

export { Message, Model } from "./trees.ts"

const demo = treeDemo({ id: "controller-tree" })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Tree(h, { ...demo.tree(model), ariaLabel: "Files", withLines: true, renderNode: leaf(h, ui) }),
      ui.Group(h, {
        mt: "md",
        children: [
          ui.Button(h, { onClick: DemoMessage.ExpandedAll(), children: ["Expand all"] }),
          ui.Button(h, { onClick: DemoMessage.CollapsedAll(), children: ["Collapse all"] })
        ]
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Expanded ${model.expandedCount} times`] })
    ]
  })
