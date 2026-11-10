import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as Picker from "../../picker/model.ts"

const options = { numberOfColumns: 2 }

export const Model = Schema.Struct({ range: Picker.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotRange: { message: Picker.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({ range: Picker.init({ id: "presets", today: "2024-05-09", type: "range" }) })

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    GotRange: ({ message: inner }) => ({ model: { range: Picker.update(model.range, inner, options).model } })
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    align: "center",
    children: [
      ui.Text(h, { size: "sm", children: [`Range: ${model.range.selection.value.join(" to ") || "none"}`] }),
      dates.DatePicker(h, {
        ...options,
        model: model.range,
        toParentMessage: (inner) => Message.GotRange({ message: inner }),
        today: "2024-05-09",
        getDayProps: (date) => (date === "2024-05-20" ? { disabled: true } : {}),
        presets: [
          { value: ["2024-05-08", "2024-05-09"], label: "Yesterday" },
          { value: ["2024-05-03", "2024-05-09"], label: "Last 7 days" },
          { value: ["2024-04-01", "2024-04-30"], label: "Last month" },
          { value: [], label: "Clear" }
        ]
      })
    ]
  })
