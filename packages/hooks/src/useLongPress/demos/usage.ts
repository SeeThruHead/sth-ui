import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { longPress } from "../../mounts.ts"

export const Model = Schema.Struct({ stages: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Pressed: { stage: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ stages: [] })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Pressed: ({ stage }) => ({ model: { stages: [...model.stages, stage].slice(-4) } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.OnMount(
            Mount.mapMessage(longPress({ threshold: 600, cancelOnMove: true }), ({ stage }) =>
              Message.Pressed({ stage })
            )
          )
        ],
        [ui.Button(h, { children: ["Press and hold"] })]
      ),
      ui.Text(h, { size: "sm", c: "dimmed", children: [`Events: ${model.stages.join(", ") || "none"}`] })
    ]
  })
