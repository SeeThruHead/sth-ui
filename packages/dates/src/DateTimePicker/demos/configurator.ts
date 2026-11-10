import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import type { DateTimeContext } from "../../InlineDateTimePicker/model.ts"
import * as DateTimePicker from "../model.ts"

import { defineConfigurator } from "@sth-ui/core/stories/controls.ts"
import type { Values } from "@sth-ui/core/stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    {
      type: "select",
      prop: "variant",
      options: ["default", "filled", "unstyled"],
      initial: "default",
      library: "default"
    },
    { type: "size", prop: "size", initial: "sm", library: "sm" },
    { type: "size", prop: "radius", initial: "md", library: "md" },
    { type: "string", prop: "label", initial: "Input label", library: "" },
    { type: "boolean", prop: "withAsterisk", initial: false, library: false },
    { type: "string", prop: "description", initial: "Input description", library: "" },
    { type: "string", prop: "error", initial: "", library: "" }
  ],
  code: `dates.DateTimePicker(h, {
{{props}}  model: model.single.picker,
  toParentMessage: (message) => Message.Got({ name: "single", message }),
  today,
  placeholder: "Pick date and time",
  clearable: true,
  name: "when",
  timePickerProps: { hoursInputLabel: "Hours" }
})`
})

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

export const view = (
  model: Model,
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Values<typeof configurator.controls>
): Html =>
  ui.Box(h, {
    maw: 340,
    mx: "auto",
    children: [
      dates.DateTimePicker(h, {
        ...contexts.single,
        model: model.single.picker,
        toParentMessage: (message) => Message.Got({ name: "single", message }),
        today,
        placeholder: "Pick date and time",
        clearable: true,
        name: "when",
        timePickerProps: { hoursInputLabel: "Hours" },
        ...props
      })
    ]
  })
