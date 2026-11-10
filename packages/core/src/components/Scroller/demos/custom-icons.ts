import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ArrowLeftIcon } from "@sth-ui/icons/icons/ArrowLeftIcon.ts"
import { ArrowRightIcon } from "@sth-ui/icons/icons/ArrowRightIcon.ts"
import * as Scroller from "../Scroller.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ scroller: Scroller.Model, clicks: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotScroller: { message: Scroller.Message }, ClickedBadge: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ scroller: Scroller.init({ id: "custom-icons" }), clicks: 0 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotScroller: ({ message: inner }) => {
      const result = Scroller.update(model.scroller, inner, {})

      return {
        model: { ...model, scroller: result.model },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotScroller({ message: lifted }))
        )
      }
    },
    ClickedBadge: () => ({ model: { ...model, clicks: model.clicks + 1 }, commands: [] })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Scroller(h, {
    model: model.scroller,
    toParentMessage: (message) => Message.GotScroller({ message }),
    startControlIcon: ArrowLeftIcon(h, { size: 16 }),
    endControlIcon: ArrowRightIcon(h, { size: 16 }),
    children: [
      ui.Group(h, {
        gap: "xs",
        wrap: "nowrap",
        children: Array.from({ length: 20 }, (_, index) =>
          ui.Badge(h, {
            variant: "light",
            size: "lg",
            miw: "fit-content",
            children: [`Badge ${index + 1}`]
          })
        )
      })
    ]
  })
