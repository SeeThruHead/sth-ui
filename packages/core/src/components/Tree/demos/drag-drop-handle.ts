import type { Html, HtmlBuilder } from "foldkit/html"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import { DotsSixVerticalIcon } from "@sth-ui/icons/icons/DotsSixVerticalIcon.ts"
import type { Ui } from "../../../Ui.ts"
import type { RenderTreeNodePayload } from "../Tree.ts"
import { draggingDemo } from "./dragging.ts"
import type { Message, Model } from "./dragging.ts"

export { Message, Model } from "./dragging.ts"

const demo = draggingDemo("handle-tree", [
  {
    value: "inbox",
    label: "Inbox",
    children: [
      { value: "inbox/welcome.md", label: "welcome.md" },
      { value: "inbox/notes.md", label: "notes.md" }
    ]
  },
  { value: "archive", label: "Archive", children: [{ value: "archive/old.md", label: "old.md" }] },
  { value: "todo.md", label: "todo.md" }
])

export const { init, update } = demo

const leaf = (h: HtmlBuilder<Message>, ui: Ui, payload: RenderTreeNodePayload<Message>) =>
  ui.Group(h, {
    gap: 6,
    bind: payload.elementProps,
    styles: { root: payload.elementStyles },
    children: [
      ui.UnstyledButton(h, {
        label: `Drag ${payload.node.value}`,
        bind: payload.dragHandleProps,
        children: [DotsSixVerticalIcon(h, { size: 16 })]
      }),
      payload.hasChildren
        ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
        : FileTextIcon(h, { size: 14 }),
      h.span([], [payload.node.label])
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, {
    ...demo.tree(model),
    ariaLabel: "Notes",
    withLines: true,
    withDragAndDrop: true,
    withDragHandle: true,
    renderNode: (payload) => leaf(h, ui, payload)
  })
