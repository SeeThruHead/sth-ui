import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { focusWithin } from "../../mounts.ts"

export const Model = Schema.Struct({ focused: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Changed: { focused: Schema.Boolean } })
export type Message = typeof Message.Type

export const init = (): Model => ({ focused: false })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Changed: ({ focused }) => ({ model: { focused } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [h.OnMount(Mount.mapMessage(focusWithin(), ({ focused }) => Message.Changed({ focused })))],
    [
      ui.Paper(h, {
        p: "md",
        withBorder: true,
        maw: 360,
        mx: "auto",
        ...(model.focused ? { bg: "blue.0" } : {}),
        children: [
          ui.Text(h, { mb: "sm", children: [model.focused ? "One of the inputs is focused" : "No input is focused"] }),
          ui.TextInput(h, { id: "focus-first", label: "First input" }),
          ui.TextInput(h, { id: "focus-second", label: "Second input", mt: "sm" })
        ]
      })
    ]
  )
