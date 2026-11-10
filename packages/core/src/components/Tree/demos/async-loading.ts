import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import * as Tree from "../Tree.ts"
import type { RenderTreeNodePayload } from "../Tree.ts"

type FileNode = {
  readonly value: string
  readonly label: string
  readonly hasChildren?: boolean | undefined
  readonly children?: ReadonlyArray<FileNode> | undefined
}

const FileNode: Schema.Codec<FileNode> = Schema.Struct({
  value: Schema.String,
  label: Schema.String,
  hasChildren: Schema.optional(Schema.Boolean),
  children: Schema.optional(Schema.Array(Schema.suspend(() => FileNode)))
})

const initialData: ReadonlyArray<FileNode> = [
  { label: "Documents", value: "documents", hasChildren: true },
  { label: "Photos", value: "photos", hasChildren: true },
  { label: "README.md", value: "readme" }
]

export const Model = Schema.Struct({ tree: Tree.Model, data: Schema.Array(FileNode) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotTree: { message: Tree.Message },
  FetchedChildren: { parent: Schema.String, children: Schema.Array(FileNode) }
})
export type Message = typeof Message.Type

const FetchChildren = Command.define("TreeDemoFetchChildren", {
  args: { parent: Schema.String },
  messages: [Message.FetchedChildren],
  execute: ({ parent }) =>
    Effect.sleep(Duration.millis(800)).pipe(
      Effect.as(
        Message.FetchedChildren({
          parent,
          children: [
            { label: `${parent}/file-1.txt`, value: `${parent}/file-1.txt` },
            { label: `${parent}/file-2.txt`, value: `${parent}/file-2.txt` },
            { label: `${parent}/subfolder`, value: `${parent}/subfolder`, hasChildren: true }
          ]
        })
      )
    )
})

export const init = (): Model => ({ tree: Tree.init({ id: "async-tree", data: initialData }), data: initialData })

type Update = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const context = (model: Model) => ({ ...Tree.treeContext({ data: model.data }), loadChildren: true })

const fromTree = (model: Model, message: Tree.Message): Update => {
  const result = Tree.update(model.tree, message, context(model))

  return {
    model: { ...model, tree: result.model },
    commands: [
      ...result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
      ),
      ...result.outMessages.flatMap((out) =>
        out._tag === "LoadChildren" ? [FetchChildren({ parent: out.value })] : []
      )
    ]
  }
}

export const update = (model: Model, message: Message): Update =>
  Message.match(message, {
    GotTree: ({ message: inner }) => fromTree(model, inner),
    FetchedChildren: ({ parent, children }) =>
      fromTree(
        { ...model, data: Tree.mergeAsyncChildren(model.data, parent, children) },
        Tree.Message.ChildrenLoaded({ value: parent })
      )
  })

const leaf = (h: HtmlBuilder<Message>, ui: Ui, payload: RenderTreeNodePayload<Message>) =>
  ui.Group(h, {
    gap: 6,
    wrap: "nowrap",
    bind: payload.elementProps,
    styles: { root: payload.elementStyles },
    children: [
      payload.hasChildren
        ? (payload.expanded ? FolderOpenIcon : FolderSimpleIcon)(h, { size: 14 })
        : FileTextIcon(h, { size: 14 }),
      h.span([], [payload.node.label]),
      ...(payload.loadError === null ? [] : [ui.Text(h, { size: "xs", c: "red", children: [payload.loadError] })])
    ]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Tree(h, {
    model: model.tree,
    data: model.data,
    toParentMessage: (message) => Message.GotTree({ message }),
    ariaLabel: "Files",
    withLines: true,
    renderNode: (payload) => leaf(h, ui, payload)
  })
