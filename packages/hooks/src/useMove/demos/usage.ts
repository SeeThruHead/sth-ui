import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { ElementMessage, move } from "../../mounts.ts"

export const Model = Schema.Struct({ x: Schema.Finite, y: Schema.Finite, active: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { message: ElementMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ x: 0.2, y: 0.6, active: false })

export const update = (model: Model, message: Message): { readonly model: Model } => {
  const event = message.message
  if (event._tag === "Moved") return { model: { ...model, x: event.x, y: event.y } }
  if (event._tag === "ScrubStarted") return { model: { ...model, active: true } }
  if (event._tag === "ScrubEnded") return { model: { ...model, active: false } }

  return { model }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.DataAttribute("move-area", ""),
          h.Style({ position: "relative", width: "300px", height: "120px", background: "var(--sth-color-blue-1)" }),
          h.OnMount(Mount.mapMessage(move({}), (got) => Message.Got({ message: got })))
        ],
        [
          h.div(
            [
              h.Style({
                position: "absolute",
                left: `calc(${model.x * 100}% - 8px)`,
                top: `calc(${model.y * 100}% - 8px)`,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: model.active ? "var(--sth-color-teal-7)" : "var(--sth-color-blue-7)"
              })
            ],
            []
          )
        ]
      ),
      ui.Text(h, { children: [`Values: x ${Math.round(model.x * 100)}, y ${Math.round(model.y * 100)}`] })
    ]
  })
