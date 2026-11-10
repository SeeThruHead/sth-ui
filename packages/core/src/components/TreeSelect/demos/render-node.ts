import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [{ id: "render-select", defaultExpandAll: true }])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TreeSelect(h, {
    ...demo.select(model, 0),
    label: "Your favorite item",
    placeholder: "Pick value",
    renderNode: ({ node, hasChildren, expanded }) =>
      ui.Group(h, {
        gap: "xs",
        children: [
          hasChildren
            ? (expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 16, color: "var(--sth-color-yellow-9)" })
            : FileTextIcon(h, { size: 16 }),
          ui.Text(h, { size: "sm", children: [node.label] })
        ]
      }),
    w: "100%",
    maw: 340
  })
