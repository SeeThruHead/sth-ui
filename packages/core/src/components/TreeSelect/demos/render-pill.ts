import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"
import { selectsDemo } from "./selects.ts"
import type { Message, Model } from "./selects.ts"

export { Message, Model } from "./selects.ts"

const demo = selectsDemo(data, [
  {
    id: "render-pill-select",
    mode: "checkbox",
    checkedStrategy: "parent",
    value: ["phones", "headphones"],
    defaultExpandAll: true
  }
])

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.TreeSelect(h, {
    ...demo.select(model, 0),
    label: "Categories",
    placeholder: "Pick categories",
    renderPill: ({ node, onRemove, disabled, readOnly }) =>
      ui.Pill(h, {
        withRemoveButton: !readOnly,
        onRemove,
        disabled,
        children: [
          ui.Group(h, {
            gap: 4,
            wrap: "nowrap",
            children: [
              (node.children === undefined && node.hasChildren !== true ? FileTextIcon : FolderSimpleIcon)(h, {
                size: 12
              }),
              node.label
            ]
          })
        ]
      }),
    w: "100%",
    maw: 340
  })
