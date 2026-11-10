import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { rememberFocus, returnFocus } from "../../commands.ts"

export const Model = Schema.Struct({ opened: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Opened: {}, Closed: {}, Ignored: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ opened: false })

const ignore = () => Message.Ignored()

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Opened: () => ({
      model: { opened: true },
      commands: [Command.mapMessage(rememberFocus({ key: "dialog" }), ignore)]
    }),
    Closed: () => ({
      model: { opened: false },
      commands: [Command.mapMessage(returnFocus({ key: "dialog" }), ignore)]
    }),
    Ignored: () => ({ model })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Button(h, { onClick: Message.Opened(), children: ["Open panel"] }),
      ...(model.opened
        ? [
            ui.Paper(h, {
              p: "md",
              withBorder: true,
              children: [ui.Button(h, { variant: "default", onClick: Message.Closed(), children: ["Close panel"] })]
            })
          ]
        : [])
    ]
  })
