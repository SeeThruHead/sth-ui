import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as HoverCard from "../../HoverCard/HoverCard.ts"
import * as OverflowList from "../OverflowList.ts"
import type { Ui } from "../../../Ui.ts"
import { data, resizable } from "./fruits.ts"

export const Model = Schema.Struct({ list: OverflowList.Model, card: HoverCard.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotList: { message: OverflowList.Message },
  GotCard: { message: HoverCard.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ list: OverflowList.init(), card: HoverCard.init({ id: "overflow-card" }) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotList: ({ message: inner }) => ({
      model: { ...model, list: OverflowList.update(model.list, inner) },
      commands: []
    }),
    GotCard: ({ message: inner }) => {
      const result = HoverCard.update(model.card, inner)

      return {
        model: { ...model, card: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotCard({ message: lifted }))
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  resizable(
    h,
    "100%",
    ui.OverflowList(h, {
      model: model.list,
      toParentMessage: (message) => Message.GotList({ message }),
      data,
      gap: 4,
      renderItem: (item) => ui.Badge(h, { children: [item] }),
      renderOverflow: (items) =>
        ui.Center(h, {
          children: [
            ui.HoverCard(h, {
              model: model.card,
              toParentMessage: (message) => Message.GotCard({ message }),
              target: (bind) => ui.Badge(h, { bind, children: [`+${items.length} more`] }),
              children: items.map((item) => h.div([], [item]))
            })
          ]
        })
    })
  )
