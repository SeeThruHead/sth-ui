import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { drag, ElementMessage } from "../../mounts.ts"

const Offset = Schema.Struct({ x: Schema.Finite, y: Schema.Finite })

export const Model = Schema.Struct({ placed: Offset, moving: Offset, active: Schema.Boolean, taps: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { message: ElementMessage } })
export type Message = typeof Message.Type

export const init = (): Model => ({ placed: { x: 0, y: 0 }, moving: { x: 0, y: 0 }, active: false, taps: 0 })

export const update = (model: Model, message: Message): { readonly model: Model } => {
  const event = message.message
  if (event._tag !== "Dragged") return { model }
  if (event.tap) return { model: { ...model, taps: model.taps + 1 } }
  const [x, y] = event.movement
  if (event.last)
    return {
      model: {
        ...model,
        placed: { x: model.placed.x + x, y: model.placed.y + y },
        moving: { x: 0, y: 0 },
        active: false
      }
    }

  return { model: { ...model, moving: { x, y }, active: true } }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        [
          h.DataAttribute("draggable-card", ""),
          h.Style({
            transform: `translate(${model.placed.x + model.moving.x}px, ${model.placed.y + model.moving.y}px)`,
            touchAction: "none",
            cursor: model.active ? "grabbing" : "grab"
          }),
          h.OnMount(
            Mount.mapMessage(drag({ threshold: [4, 4], filterTaps: true }), (got) => Message.Got({ message: got }))
          )
        ],
        [ui.Paper(h, { p: "md", withBorder: true, shadow: "sm", children: ["Drag me"] })]
      ),
      ui.Text(h, {
        size: "sm",
        c: "dimmed",
        children: [
          `Offset: ${model.placed.x + model.moving.x}, ${model.placed.y + model.moving.y}; taps: ${model.taps}`
        ]
      })
    ]
  })
