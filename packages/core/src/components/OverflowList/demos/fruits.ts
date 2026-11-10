import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as OverflowList from "../OverflowList.ts"

export const data = [
  "Apple",
  "Banana",
  "Cherry",
  "Date",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
  "Indian Fig",
  "Jackfruit",
  "Kiwi",
  "Lemon",
  "Mango",
  "Nectarine",
  "Orange",
  "Papaya"
]

export const Model = OverflowList.Model
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotList: { message: OverflowList.Message } })
export type Message = typeof Message.Type

export const init = (): Model => OverflowList.init()

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: OverflowList.update(model, message.message),
  commands: []
})

export const list = (model: Model) => ({
  model,
  toParentMessage: (message: OverflowList.Message) => Message.GotList({ message })
})

export const resizable = <M>(h: HtmlBuilder<M>, maxWidth: string, child: Html): Html =>
  h.div(
    [h.DataAttribute("testid", "resizable"), h.Style({ resize: "horizontal", overflow: "auto", maxWidth })],
    [child]
  )
