import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import type { DateTimeContext } from "../../InlineDateTimePicker/model.ts"
import * as DateTimePicker from "../model.ts"

const bold = stylex.create({ input: { fontWeight: 700 } })

const today = "2024-05-09"

const names = ["single", "range", "locked"] as const

type Name = (typeof names)[number]

const contexts: Readonly<Record<Name, DateTimeContext>> = {
  single: { maxDate: "2024-05-28 18:00:00" },
  range: { withSeconds: true, defaultTimeValue: "09:00:00" },
  locked: { withSeconds: true }
}

const Entry = Schema.Struct({ picker: DateTimePicker.Model, value: Schema.Array(Schema.String) })

export const Model = Schema.Struct({ single: Entry, range: Entry, locked: Entry })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.Literals(names), message: DateTimePicker.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  single: {
    picker: DateTimePicker.init({ id: "single", today, value: ["2024-05-14 10:30:00"] }, contexts.single),
    value: ["2024-05-14 10:30:00"]
  },
  range: { picker: DateTimePicker.init({ id: "range", today, type: "range" }, contexts.range), value: [] },
  locked: {
    picker: DateTimePicker.init({ id: "locked", today, value: ["2024-05-01 08:00:00"] }),
    value: ["2024-05-01 08:00:00"]
  }
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const entry = model[message.name]
  const result = DateTimePicker.update(entry.picker, message.message, contexts[message.name])
  const value = result.outMessages.reduce((last, out) => (out._tag === "Changed" ? out.value : last), entry.value)

  return {
    model: { ...model, [message.name]: { picker: result.model, value } },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.Got({ name: message.name, message: inner }))
    )
  }
}

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.DateTimePicker(h, {
        ...contexts.single,
        model: model.single.picker,
        toParentMessage: (message) => Message.Got({ name: "single", message }),
        today,
        label: "Pick date and time",
        placeholder: "Pick date and time",
        clearable: true,
        name: "when",
        timePickerProps: { hoursInputLabel: "Hours" }
      }),
      dates.DateTimePicker(h, {
        ...contexts.range,
        model: model.range.picker,
        toParentMessage: (message) => Message.Got({ name: "range", message }),
        today,
        label: "Pick a range",
        styles: { input: bold.input },
        valueFormat: "DD MMM HH:mm:ss",
        name: "span",
        timePickerProps: { hoursInputLabel: "Start hours" },
        endTimePickerProps: { hoursInputLabel: "End hours" },
        size: "md"
      }),
      dates.DateTimePicker(h, {
        model: model.locked.picker,
        toParentMessage: (message) => Message.Got({ name: "locked", message }),
        today,
        label: "Read only",
        clearable: true,
        readOnly: true,
        withSeconds: true,
        labelSeparator: "to"
      }),
      ui.Text(h, {
        size: "sm",
        children: [names.map((name) => `${name}=${model[name].value.join("/") || "-"}`).join(" ")]
      })
    ]
  })
