import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { ElementMessage, radialMove } from "../../mounts.ts"

export const Model = Schema.Struct({ value: Schema.Finite, ended: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { message: ElementMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ value: 115, ended: 115 })

export const update = (model: Model, message: Message): { readonly model: Model } => {
  const event = message.message
  if (event._tag === "Turned") return { model: { ...model, value: event.value } }
  if (event._tag === "TurnEnded") return { model: { ...model, ended: event.value } }

  return { model }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.DataAttribute("dial", ""),
          h.Style({
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: `conic-gradient(var(--sth-color-blue-6) ${model.value}deg, var(--sth-color-gray-2) 0)`
          }),
          h.OnMount(Mount.mapMessage(radialMove({ step: 1 }), (got) => Message.Got({ message: got })))
        ],
        []
      ),
      ui.Text(h, { children: [`Value: ${model.value}°, last released at ${model.ended}°`] })
    ]
  })
