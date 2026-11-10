import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { clickOutside } from "../clickOutside.ts"

export const Model = Schema.Struct({ clicks: Schema.Int, enabled: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ ClickedOutside: {}, Toggled: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ clicks: 0, enabled: true })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    ClickedOutside: () => ({ model: { ...model, clicks: model.clicks + 1 } }),
    Toggled: () => ({ model: { ...model, enabled: !model.enabled } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      h.div(
        model.enabled
          ? [
              h.OnMount(
                Mount.mapMessage(
                  clickOutside({ nodes: ["#outside-first", "#outside-second"], events: ["click"], capture: true }),
                  () => Message.ClickedOutside()
                )
              )
            ]
          : [],
        [
          ui.Group(h, {
            children: [
              ui.Paper(h, { id: "outside-first", withBorder: true, p: "md", children: ["First"] }),
              ui.Paper(h, { id: "outside-second", withBorder: true, p: "md", children: ["Second"] })
            ]
          })
        ]
      ),
      ui.Text(h, { children: [`Clicks outside both: ${model.clicks}`] }),
      ui.Button(h, {
        variant: "default",
        onClick: Message.Toggled(),
        children: [model.enabled ? "Stop listening" : "Listen again"]
      })
    ]
  })
