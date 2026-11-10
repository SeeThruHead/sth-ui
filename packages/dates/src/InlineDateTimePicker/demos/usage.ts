import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as DateTime from "../model.ts"
import type { DateTimeContext } from "../model.ts"

const today = "2024-05-09"

const contexts: Readonly<Record<"single" | "range", DateTimeContext>> = {
  single: { minDate: "2024-05-03 09:00:00", maxDate: "2024-05-28 18:00:00" },
  range: { withSeconds: true, defaultTimeValue: "10:00:00", timePicker: { format: "12h" } }
}

const Entry = Schema.Struct({ picker: DateTime.Model, value: Schema.Array(Schema.String), submitted: Schema.Int })

export const Model = Schema.Struct({ single: Entry, range: Entry })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { name: Schema.Literals(["single", "range"]), message: DateTime.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  single: {
    picker: DateTime.init({ id: "single", today, value: ["2024-05-14 10:30:00"] }, contexts.single),
    value: ["2024-05-14 10:30:00"],
    submitted: 0
  },
  range: { picker: DateTime.init({ id: "range", today, type: "range" }, contexts.range), value: [], submitted: 0 }
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const entry = model[message.name]
  const result = DateTime.update(entry.picker, message.message, contexts[message.name])
  const value = result.outMessages.reduce((last, out) => (out._tag === "Changed" ? out.value : last), entry.value)
  const submitted = entry.submitted + result.outMessages.filter((out) => out._tag === "Submitted").length

  return {
    model: { ...model, [message.name]: { picker: result.model, value, submitted } },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.Got({ name: message.name, message: inner }))
    )
  }
}

const summary = (entry: typeof Entry.Type) => `${entry.value.join(" to ") || "nothing"}; submitted ${entry.submitted}`

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    justify: "center",
    children: [
      ui.Stack(h, {
        gap: "xs",
        children: [
          dates.InlineDateTimePicker(h, {
            ...contexts.single,
            model: model.single.picker,
            toParentMessage: (message) => Message.Got({ name: "single", message }),
            today,
            timePickerProps: { hoursInputLabel: "Hours", minutesInputLabel: "Minutes" }
          }),
          ui.Text(h, { size: "sm", children: [`Single: ${summary(model.single)}`] })
        ]
      }),
      ui.Stack(h, {
        gap: "xs",
        children: [
          dates.InlineDateTimePicker(h, {
            ...contexts.range,
            model: model.range.picker,
            toParentMessage: (message) => Message.Got({ name: "range", message }),
            today,
            size: "xs",
            submitLabel: "Done",
            timePickerProps: { hoursInputLabel: "Start hours", format: "12h" },
            endTimePickerProps: { hoursInputLabel: "End hours", format: "12h" },
            styles: { rangeInfo: [] }
          }),
          ui.Text(h, { size: "sm", children: [`Range: ${summary(model.range)}`] })
        ]
      })
    ]
  })
