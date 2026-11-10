import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as Picker from "../../picker/model.ts"

export const Model = Schema.Struct({ single: Picker.Model, multiple: Picker.Model, range: Picker.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSingle: { message: Picker.Message },
  GotMultiple: { message: Picker.Message },
  GotRange: { message: Picker.Message }
})
export type Message = typeof Message.Type

const today = "2024-05-09"

export const init = (): Model => ({
  single: Picker.init({ id: "single", today, value: ["2024-05-14"] }),
  multiple: Picker.init({ id: "multiple", today, type: "multiple" }),
  range: Picker.init({ id: "range", today, type: "range" })
})

export const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    GotSingle: ({ message: inner }) => ({
      model: { ...model, single: Picker.update(model.single, inner, { allowDeselect: true }).model }
    }),
    GotMultiple: ({ message: inner }) => ({
      model: { ...model, multiple: Picker.update(model.multiple, inner).model }
    }),
    GotRange: ({ message: inner }) => ({ model: { ...model, range: Picker.update(model.range, inner).model } })
  })

const labelled = (h: HtmlBuilder<Message>, ui: Ui, title: string, value: ReadonlyArray<string>, picker: Html) =>
  ui.Stack(h, {
    gap: "xs",
    align: "center",
    children: [ui.Text(h, { size: "sm", fw: 500, children: [`${title}: ${value.join(" to ") || "none"}`] }), picker]
  })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    justify: "center",
    align: "flex-start",
    children: [
      labelled(
        h,
        ui,
        "Date",
        model.single.selection.value,
        dates.DatePicker(h, {
          model: model.single,
          toParentMessage: (inner) => Message.GotSingle({ message: inner }),
          today
        })
      ),
      labelled(
        h,
        ui,
        "Dates",
        model.multiple.selection.value,
        dates.DatePicker(h, {
          model: model.multiple,
          toParentMessage: (inner) => Message.GotMultiple({ message: inner }),
          today
        })
      ),
      labelled(
        h,
        ui,
        "Range",
        model.range.selection.value,
        dates.DatePicker(h, {
          model: model.range,
          toParentMessage: (inner) => Message.GotRange({ message: inner }),
          today
        })
      )
    ]
  })
