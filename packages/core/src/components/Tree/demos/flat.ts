import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Tree from "../Tree.ts"
import type { Ui } from "../../../Ui.ts"
import { data } from "./data.ts"

export const Model = Tree.Model
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTree: { message: Tree.Message } })
export type Message = typeof Message.Type

export const init = (): Model => Tree.init({ id: "flat-tree" })

const context = Tree.treeContext({ data })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = Tree.update(model, message.message, context)

  return {
    model: result.model,
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html => {
  const props = { model, toParentMessage: (message: Tree.Message) => Message.GotTree({ message }), data }

  return h.div(
    ui.treeRootAttributes(h, { ...props, ariaLabel: "Flat tree" }),
    Tree.flattenTreeData(data, model.expanded).map((entry, index) =>
      ui.FlatTreeNode(h, { ...props, entry, focusable: index === 0 })
    )
  )
}
