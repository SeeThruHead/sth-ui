import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Tree from "../Tree.ts"
import type { TreeAllowDrop } from "../Tree.ts"

export type DemoNode = {
  readonly value: string
  readonly label: string
  readonly children?: ReadonlyArray<DemoNode> | undefined
}

const DemoNode: Schema.Codec<DemoNode> = Schema.Struct({
  value: Schema.String,
  label: Schema.String,
  children: Schema.optional(Schema.Array(Schema.suspend(() => DemoNode)))
})

export const Model = Schema.Struct({ tree: Tree.Model, data: Schema.Array(DemoNode), drops: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTree: { message: Tree.Message } })
export type Message = typeof Message.Type

export const draggingDemo = (id: string, start: ReadonlyArray<DemoNode>, allowDrop?: TreeAllowDrop) => ({
  init: (): Model => ({
    tree: Tree.init({ id, data: start, initialExpandedState: Tree.getTreeExpandedState(start, "*") }),
    data: start,
    drops: 0
  }),
  update: (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const result = Tree.update(
      model.tree,
      message.message,
      Tree.treeContext({ data: model.data, ...(allowDrop === undefined ? {} : { allowDrop }) })
    )
    const moved = result.outMessages.reduce(
      (data, out) => (out._tag === "DragDropped" ? Tree.moveTreeNode(data, out) : data),
      model.data
    )

    return {
      model: {
        tree: result.model,
        data: moved,
        drops: model.drops + result.outMessages.filter((out) => out._tag === "DragDropped").length
      },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.GotTree({ message: lifted }))
      )
    }
  },
  tree: (model: Model) => ({
    model: model.tree,
    data: model.data,
    toParentMessage: (message: Tree.Message) => Message.GotTree({ message }),
    ...(allowDrop === undefined ? {} : { allowDrop })
  })
})
