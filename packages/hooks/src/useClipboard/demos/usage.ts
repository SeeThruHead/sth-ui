import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { BrowserMessage, copyText, expireCopy } from "../../commands.ts"
import { clipboard, copied, copyFailed, expired, resetClipboard } from "../clipboard.ts"

export const Model = Schema.Struct({
  copied: Schema.Boolean,
  error: Schema.Option(Schema.String),
  generation: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Clicked: {},
  Reset: {},
  Got: { message: BrowserMessage }
})
export type Message = typeof Message.Type

const got = (message: BrowserMessage) => Message.Got({ message })

export const init = (): Model => clipboard

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Clicked: () => ({ model, commands: [Command.mapMessage(copyText({ text: "Hello, world!" }), got)] }),
    Reset: () => ({ model: resetClipboard(model) }),
    Got: ({ message: result }) =>
      BrowserMessage.match(result, {
        Copied: () => {
          const next = copied(model)

          return {
            model: next,
            commands: [Command.mapMessage(expireCopy({ generation: next.generation, timeout: 1000 }), got)]
          }
        },
        CopyFailed: ({ error }) => ({ model: copyFailed(model, error) }),
        CopyExpired: ({ generation }) => ({ model: expired(model, generation) }),
        Done: () => ({ model }),
        Failed: () => ({ model }),
        Picked: () => ({ model }),
        FilesPicked: () => ({ model }),
        Cancelled: () => ({ model }),
        ScrollFinished: () => ({ model }),
        ScrollCancelled: () => ({ model })
      })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, {
            color: model.copied ? "teal" : "blue",
            onClick: Message.Clicked(),
            children: [model.copied ? "Copied" : "Copy"]
          }),
          ui.Button(h, { variant: "default", onClick: Message.Reset(), children: ["Reset"] })
        ]
      }),
      ...Option.toArray(
        Option.map(model.error, (error) => ui.Text(h, { c: "red", size: "sm", children: [`Could not copy: ${error}`] }))
      )
    ]
  })
