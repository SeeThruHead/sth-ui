import { Array as Arr, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "../Popover.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ popovers: Schema.Array(Popover.Model) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotPopover: { index: Schema.Int, message: Popover.Message } })
export type Message = typeof Message.Type

const popovers = [
  {
    id: "centre",
    button: "Arrow in the centre",
    options: { position: "left-start", withArrow: true, arrowPosition: "center" }
  },
  {
    id: "end",
    button: "Arrow at the end",
    options: {
      position: "top-end",
      withArrow: true,
      arrowOffset: 12,
      arrowRadius: 3,
      width: "16rem",
      radius: "lg",
      focusSelector: "button"
    }
  }
] as const

export const init = (): Model => ({
  popovers: popovers.map((popover) => Popover.open(Popover.init({ id: popover.id, isAnimated: false })).model)
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotPopover: ({ index, message: inner }) => {
      const results = model.popovers.map((popover, at) =>
        at === index ? Popover.update(popover, inner) : { model: popover, commands: [] }
      )

      return {
        model: { popovers: results.map((result) => result.model) },
        commands: results.flatMap((result) =>
          (result.commands ?? []).map((command) =>
            Command.mapMessage(command, (lifted) => Message.GotPopover({ index, message: lifted }))
          )
        )
      }
    }
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    gap: 120,
    children: Arr.zip(popovers, model.popovers).map(([item, popover], index) =>
      ui.Popover(h, {
        ...item.options,
        model: popover,
        toParentMessage: (message) => Message.GotPopover({ index, message }),
        target: (bind) => ui.Button(h, { bind, children: [item.button] }),
        children: [ui.Button(h, { size: "xs", children: ["Save"] })]
      })
    )
  })
