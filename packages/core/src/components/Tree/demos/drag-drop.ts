import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import type { RenderTreeNodePayload } from "../Tree.ts"
import { draggingDemo } from "./dragging.ts"
import type { Message, Model } from "./dragging.ts"

export { Message, Model } from "./dragging.ts"

const demo = draggingDemo("drag-tree", [
  {
    value: "src",
    label: "src",
    children: [
      {
        value: "src/components",
        label: "components",
        children: [
          { value: "src/components/Accordion.tsx", label: "Accordion.tsx" },
          { value: "src/components/Tree.tsx", label: "Tree.tsx" }
        ]
      }
    ]
  },
  { value: "package.json", label: "package.json" },
  { value: "tsconfig.json", label: "tsconfig.json" }
])

export const { init, update } = demo

const leaf = (h: HtmlBuilder<Message>, ui: Ui, payload: RenderTreeNodePayload<Message>) =>
  ui.Group(h, {
    gap: 6,
    bind: payload.elementProps,
    styles: { root: payload.elementStyles },
    children: [
      payload.hasChildren
        ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
        : FileTextIcon(h, { size: 14 }),
      h.span([], [payload.node.label])
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "flex-start",
    children: [
      ui.Tree(h, {
        ...demo.tree(model),
        ariaLabel: "Files",
        withLines: true,
        withDragAndDrop: true,
        renderNode: (payload) => leaf(h, ui, payload)
      }),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Dropped ${model.drops} times`] })
    ]
  })
