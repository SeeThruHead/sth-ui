import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { FileTextIcon } from "@sth-ui/icons/icons/FileTextIcon.ts"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import { FolderSimpleIcon } from "@sth-ui/icons/icons/FolderSimpleIcon.ts"
import type { Ui } from "../../../Ui.ts"
import * as Tree from "../Tree.ts"
import type { InitConfig, RenderTreeNodePayload, TreeOptions } from "../Tree.ts"
import { data } from "./data.ts"

export const Model = Schema.Struct({ tree: Tree.Model, expandedCount: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotTree: { message: Tree.Message },
  ExpandedAll: {},
  CollapsedAll: {}
})
export type Message = typeof Message.Type

type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

export const treeDemo = (config: InitConfig, options: TreeOptions = {}) => {
  const context = Tree.treeContext({ data, ...options })
  const route = (model: Model, message: Tree.Message): Result => {
    const result = Tree.update(model.tree, message, context)

    return {
      model: {
        tree: result.model,
        expandedCount: model.expandedCount + result.outMessages.filter((out) => out._tag === "NodeExpanded").length
      },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
      )
    }
  }

  return {
    init: (): Model => ({ tree: Tree.init({ data, ...config }), expandedCount: 0 }),
    update: (model: Model, message: Message): Result =>
      Message.match(message, {
        GotTree: ({ message: inner }) => route(model, inner),
        ExpandedAll: () => route(model, Tree.Message.ExpandedAll()),
        CollapsedAll: () => route(model, Tree.Message.CollapsedAll())
      }),
    tree: (model: Model) => ({
      ...options,
      model: model.tree,
      toParentMessage: (message: Tree.Message) => Message.GotTree({ message }),
      data
    })
  }
}

export const leaf =
  (h: HtmlBuilder<Message>, ui: Ui) =>
  (payload: RenderTreeNodePayload<Message>): Html =>
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
