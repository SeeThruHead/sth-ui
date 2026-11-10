import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { treeDemo } from "./trees.ts"
import type { Message, Model } from "./trees.ts"

export { Message, Model } from "./trees.ts"

const demo = treeDemo({ id: "checked-tree" }, { expandOnClick: false })

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, {
    ...demo.tree(model),
    ariaLabel: "Files",
    levelOffset: 23,
    withLines: true,
    renderNode: (payload) =>
      ui.Group(h, {
        gap: "xs",
        bind: payload.elementProps,
        styles: { root: payload.elementStyles },
        children: [
          ui.Checkbox(h, {
            id: `checked-${payload.node.value.replaceAll(/[^\w-]/g, "-")}`,
            size: "xs",
            checked: payload.checked,
            indeterminate: payload.indeterminate,
            onChange: () => payload.actions.toggleChecked,
            attributes: { input: { "aria-label": `Check ${payload.node.value}` } }
          }),
          ui.Group(h, {
            gap: 6,
            attributes: { root: { "data-toggle": "" } },
            children: [
              payload.hasChildren
                ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
                : FileTextIcon(h, { size: 14 }),
              h.span([], [payload.node.label])
            ]
          })
        ]
      })
  })
