import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import { timeRange } from "../../time/clock.ts"

import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "select", prop: "format", options: ["12h", "24h"], initial: "24h", library: "24h" },
    { type: "boolean", prop: "withSeconds", initial: false },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "sm", library: "sm" }
  ],
  code: `dates.TimeGrid(h, {
{{props}}  data: timeRange("10:00", "14:00", "01:00").map((time) => time.slice(0, 5)),
  value: model.slot,
  onChange: (value) => Message.Slot({ value }),
  allowDeselect: true,
  disableTime: ["12:00"],
  getControlProps: (time) => ({ attributes: { "aria-label": \`Slot at \${time}\` } })
})`
})

export const Model = Schema.Struct({ slot: Schema.NullOr(Schema.String), evening: Schema.NullOr(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Slot: { value: Schema.NullOr(Schema.String) },
  Evening: { value: Schema.NullOr(Schema.String) }
})
export type Message = typeof Message.Type

export const init = (): Model => ({ slot: "10:00", evening: null })

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Slot: ({ value }) => ({ model: { ...model, slot: value } }),
    Evening: ({ value }) => ({ model: { ...model, evening: value } })
  })

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Box(h, {
    maw: 420,
    mx: "auto",
    children: [
      dates.TimeGrid(h, {
        data: timeRange("10:00", "14:00", "01:00").map((time) => time.slice(0, 5)),
        value: model.slot,
        onChange: (value) => Message.Slot({ value }),
        allowDeselect: true,
        disableTime: ["12:00"],
        getControlProps: (time) => ({ attributes: { "aria-label": `Slot at ${time}` } }),
        ...props
      })
    ]
  })
