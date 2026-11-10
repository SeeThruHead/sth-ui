import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { resizeObserver } from "../../mounts.ts"

export const Model = Schema.Struct({ wide: Schema.Boolean, width: Schema.Finite, height: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {}, Resized: { width: Schema.Finite, height: Schema.Finite } })
export type Message = typeof Message.Type

export const init = (): Model => ({ wide: false, width: 0, height: 0 })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Toggled: () => ({ model: { ...model, wide: !model.wide } }),
    Resized: ({ width, height }) => ({ model: { ...model, width, height } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.DataAttribute("measured", ""),
          h.Style({ width: model.wide ? "300px" : "200px", height: "80px", background: "var(--sth-color-blue-1)" }),
          h.OnMount(Mount.mapMessage(resizeObserver(), ({ width, height }) => Message.Resized({ width, height })))
        ],
        []
      ),
      ui.Text(h, { children: [`Width: ${model.width}, height: ${model.height}`] }),
      ui.Button(h, { variant: "default", onClick: Message.Toggled(), children: [model.wide ? "Narrow" : "Widen"] })
    ]
  })
