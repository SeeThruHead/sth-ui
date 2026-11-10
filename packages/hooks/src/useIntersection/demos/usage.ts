import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { intersection } from "../../mounts.ts"

export const Model = Schema.Struct({ visible: Schema.Boolean, ratio: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Intersected: { visible: Schema.Boolean, ratio: Schema.Finite } })
export type Message = typeof Message.Type

export const init = (): Model => ({ visible: false, ratio: 0 })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands?: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Intersected: ({ visible, ratio }) => ({ model: { visible, ratio } }) })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, {
        children: [model.visible ? `Box is visible (${Math.round(model.ratio * 100)}%)` : "Scroll down to the box"]
      }),
      h.div([h.Style({ height: "120vh" })], []),
      h.div(
        [
          h.DataAttribute("observed", ""),
          h.Style({
            width: "160px",
            height: "80px",
            background: model.visible ? "var(--sth-color-teal-6)" : "var(--sth-color-gray-4)"
          }),
          h.OnMount(
            Mount.mapMessage(intersection({ threshold: [0, 1] }), ({ isIntersecting, intersectionRatio }) =>
              Message.Intersected({ visible: isIntersecting, ratio: intersectionRatio })
            )
          )
        ],
        []
      )
    ]
  })
