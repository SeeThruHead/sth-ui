import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"
import * as TimePicker from "../model.ts"
import type { TimePickerContext } from "../model.ts"

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
  code: `dates.TimePicker(h, {
{{props}}  clearable: true,
  name: "time",
  hoursInputLabel: "Hours",
  minutesInputLabel: "Minutes"
})`
})

const names = ["plain", "dropdown", "limited", "duration", "presets", "locked", "select", "flat", "off"] as const

type Name = (typeof names)[number]

const contexts: Readonly<Record<Name, TimePickerContext>> = {
  plain: {},
  dropdown: { format: "12h", withSeconds: true },
  limited: { min: "09:00", max: "17:30", minutesStep: 15 },
  duration: { type: "duration", withSeconds: true },
  presets: { closeDropdownOnPresetSelect: true },
  locked: { readOnly: true, format: "12h" },
  select: { format: "12h", amPmLabels: { am: "am", pm: "pm" } },
  flat: { withSeconds: true },
  off: { disabled: true, format: "12h" }
}

const Entry = Schema.Struct({ picker: TimePicker.Model, value: Schema.String })

export const Model = Schema.Struct({
  plain: Entry,
  dropdown: Entry,
  limited: Entry,
  duration: Entry,
  presets: Entry,
  locked: Entry,
  select: Entry,
  flat: Entry,
  off: Entry
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.Literals(names), message: TimePicker.Message } })
export type Message = typeof Message.Type

const initial: Readonly<Record<Name, string>> = {
  plain: "14:30",
  dropdown: "",
  limited: "",
  duration: "",
  presets: "",
  locked: "08:15",
  select: "21:05",
  flat: "10:30:00",
  off: "07:00"
}

const entry = (name: Name) => ({
  picker: TimePicker.init({ id: name, value: initial[name] }, contexts[name]),
  value: initial[name]
})

export const init = (): Model => ({
  plain: entry("plain"),
  dropdown: entry("dropdown"),
  limited: entry("limited"),
  duration: entry("duration"),
  presets: entry("presets"),
  locked: entry("locked"),
  select: entry("select"),
  flat: entry("flat"),
  off: entry("off")
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const current = model[message.name]
  const result = TimePicker.update(current.picker, message.message, contexts[message.name])
  const value = result.outMessages.reduce((last, out) => (out._tag === "Changed" ? out.value : last), current.value)

  return {
    model: { ...model, [message.name]: { picker: result.model, value } },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.Got({ name: message.name, message: inner }))
    )
  }
}

const picker = (model: Model, name: Name) => ({
  ...contexts[name],
  model: model[name].picker,
  toParentMessage: (message: TimePicker.Message) => Message.Got({ name, message })
})

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
      dates.TimePicker(h, {
        ...picker(model, "plain"),
        clearable: true,
        name: "time",
        hoursInputLabel: "Hours",
        minutesInputLabel: "Minutes",
        ...props
      })
    ]
  })
