import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "@foldkit/ui/popover"
import { compare } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import * as Picker from "./model.ts"
import type { PickerOptions } from "./model.ts"
import type { PickerLevel, PickerType } from "./selection.ts"

export const Model = Schema.Struct({ popover: Popover.Model, picker: Picker.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotPopover: { message: Popover.Message },
  GotPicker: { message: Picker.Message },
  Cleared: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Array(Schema.String) },
  Opened: {},
  Closed: {}
})
export type OutMessage = typeof OutMessage.Type

export type PickerInputOptions = PickerOptions & { readonly closeOnChange?: boolean; readonly sortDates?: boolean }

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: {
  readonly id: string
  readonly today: DateString
  readonly level?: PickerLevel
  readonly type?: PickerType
  readonly value?: ReadonlyArray<DateString>
}): Model => ({
  popover: Popover.init({ id: config.id, isAnimated: true }),
  picker: Picker.init({ ...config, id: `${config.id}-picker` })
})

export const gotPopover = (message: Popover.Message): Message => Message.GotPopover({ message })

const unfinishedRange = (model: Model) =>
  model.picker.selection.type === "range" && model.picker.selection.value.length === 1

const lifted = (model: Model, result: ReturnType<typeof Popover.update>): Result => {
  const commands = (result.commands ?? []).map((command) => Command.mapMessage(command, gotPopover))
  const next = { ...model, popover: result.model }
  if (result.outMessage?._tag === "Opened") return { model: next, commands, outMessages: [OutMessage.Opened()] }
  if (result.outMessage?._tag !== "Closed") return { model: next, commands, outMessages: [] }
  if (!unfinishedRange(next)) return { model: next, commands, outMessages: [OutMessage.Closed()] }

  return {
    model: { ...next, picker: Picker.setValue(next.picker, []) },
    commands,
    outMessages: [OutMessage.Changed({ value: [] }), OutMessage.Closed()]
  }
}

const complete = (type: PickerType, value: ReadonlyArray<DateString>) => {
  if (type === "default") return true

  return type === "range" && value.length === 2
}

const closing = (model: Model, outMessages: ReadonlyArray<OutMessage>, close: boolean): Result => {
  if (!close) return { model, commands: [], outMessages }
  const closed = lifted(model, Popover.close(model.popover))

  return { ...closed, outMessages: [...outMessages, ...closed.outMessages] }
}

const changed = (model: Model, value: ReadonlyArray<DateString>, options: PickerInputOptions): Result => {
  const type = model.picker.selection.type
  const sorting = type === "multiple" && options.sortDates !== false
  const sorted = sorting ? value.toSorted(compare) : value
  const next = sorting ? { ...model, picker: Picker.setValue(model.picker, sorted) } : model

  return closing(
    next,
    [OutMessage.Changed({ value: sorted })],
    options.closeOnChange !== false && complete(type, sorted)
  )
}

const fromPicker = (model: Model, message: Picker.Message, options: PickerInputOptions): Result => {
  const result = Picker.update(model.picker, message, options)
  const next = { ...model, picker: result.model }
  const change = result.outMessages.find((out) => out._tag === "Changed")
  if (change?._tag !== "Changed") return { model: next, commands: [], outMessages: [] }

  return changed(next, change.value, options)
}

export const update = (model: Model, message: Message, options: PickerInputOptions = {}): Result =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => lifted(model, Popover.update(model.popover, inner)),
    GotPicker: ({ message: inner }) => fromPicker(model, inner, options),
    Cleared: () => ({
      model: { ...model, picker: Picker.setValue(model.picker, []) },
      commands: [],
      outMessages: [OutMessage.Changed({ value: [] })]
    })
  })

export const setValue = (model: Model, value: ReadonlyArray<DateString>): Model => ({
  ...model,
  picker: Picker.setValue(model.picker, value)
})
