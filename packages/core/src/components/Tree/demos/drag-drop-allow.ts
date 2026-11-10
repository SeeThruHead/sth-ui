import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import { childAttributes } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import type { RenderTreeNodePayload } from "../Tree.ts"
import { draggingDemo } from "./dragging.ts"
import type { Message, Model } from "./dragging.ts"

export { Message, Model } from "./dragging.ts"

const isLocked = (value: string) => value === "components" || value.startsWith("components/")

const demo = draggingDemo(
  "allow-tree",
  [
    {
      value: "pages",
      label: "Pages",
      children: [
        { value: "pages/index.tsx", label: "index.tsx" },
        { value: "pages/about.tsx", label: "about.tsx" }
      ]
    },
    {
      value: "components",
      label: "Components (locked)",
      children: [
        { value: "components/Header.tsx", label: "Header.tsx" },
        { value: "components/Footer.tsx", label: "Footer.tsx" }
      ]
    },
    { value: "package.json", label: "package.json" }
  ],
  ({ draggedNode, targetNode, position }) => {
    if (isLocked(draggedNode)) return false
    if (targetNode === "components" && position === "inside") return false

    return !targetNode.startsWith("components/")
  }
)

export const { init, update } = demo

const leaf = (h: HtmlBuilder<Message>, ui: Ui, payload: RenderTreeNodePayload<Message>) =>
  ui.Group(h, {
    gap: 6,
    bind: isLocked(payload.node.value)
      ? [...payload.elementProps, ...childAttributes([h.Draggable(false)])]
      : payload.elementProps,
    styles: { root: payload.elementStyles },
    children: [
      payload.hasChildren
        ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
        : FileTextIcon(h, { size: 14 }),
      h.span([], [payload.node.label])
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, {
    ...demo.tree(model),
    ariaLabel: "Project",
    withLines: true,
    withDragAndDrop: true,
    renderNode: (payload) => leaf(h, ui, payload)
  })
