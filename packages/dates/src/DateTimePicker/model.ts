import * as Popover from "@foldkit/ui/popover"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import type { DateString } from "../date/date.ts"
import * as Inline from "../InlineDateTimePicker/model.ts"
import type { DateTimeContext } from "../InlineDateTimePicker/model.ts"
import type { PickerType } from "../picker/selection.ts"
import { clampDateTime } from "../time/datetime.ts"
import type { DateTimeString } from "../time/datetime.ts"

export const Model = Schema.Struct({ popover: Popover.Model, inline: Inline.Model })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotPopover: { message: Popover.Message },
  GotInline: { message: Inline.Message },
  Cleared: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Array(Schema.String) },
  Opened: {},
  Closed: {}
})
export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (
  config: {
    readonly id: string
    readonly today: DateString
    readonly type?: Exclude<PickerType, "multiple">
    readonly value?: ReadonlyArray<DateTimeString>
  },
  context: DateTimeContext = {}
): Model => ({
  popover: Popover.init({ id: config.id, isAnimated: true }),
  inline: Inline.init({ ...config, id: `${config.id}-inline` }, context)
})

export const gotPopover = (message: Popover.Message): Message => Message.GotPopover({ message })

export const gotInline = (message: Inline.Message): Message => Message.GotInline({ message })

const settled = (model: Model, context: DateTimeContext): Result => {
  const value = model.inline.value
  const range = model.inline.picker.selection.type === "range"
  const whole = range && value.length === 1 ? [] : value
  const clamped = whole.map((item) => clampDateTime(item, context.minDate, context.maxDate))
  const changed = clamped.length !== value.length || clamped.some((item, index) => item !== value[index])
  const inline = changed ? Inline.setValue(model.inline, clamped, context) : model.inline

  return {
    model: { ...model, inline },
    commands: [],
    outMessages: [...(changed ? [OutMessage.Changed({ value: clamped })] : []), OutMessage.Closed()]
  }
}

const lifted = (model: Model, result: ReturnType<typeof Popover.update>, context: DateTimeContext): Result => {
  const commands = (result.commands ?? []).map((command) => Command.mapMessage(command, gotPopover))
  const next = { ...model, popover: result.model }
  if (result.outMessage?._tag === "Opened") return { model: next, commands, outMessages: [OutMessage.Opened()] }
  if (result.outMessage?._tag !== "Closed") return { model: next, commands, outMessages: [] }
  const closed = settled(next, context)

  return { ...closed, commands }
}

const fromInline = (model: Model, message: Inline.Message, context: DateTimeContext): Result => {
  const result = Inline.update(model.inline, message, context)
  const commands = result.commands.map((command) => Command.mapMessage(command, gotInline))
  const next = { ...model, inline: result.model }
  const changes = result.outMessages.flatMap((out) =>
    out._tag === "Changed" ? [OutMessage.Changed({ value: out.value })] : []
  )
  if (!result.outMessages.some((out) => out._tag === "Submitted"))
    return { model: next, commands, outMessages: changes }
  const closed = lifted(next, Popover.close(next.popover), context)

  return { ...closed, commands: [...commands, ...closed.commands], outMessages: [...changes, ...closed.outMessages] }
}

export const update = (model: Model, message: Message, context: DateTimeContext = {}): Result =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => lifted(model, Popover.update(model.popover, inner), context),
    GotInline: ({ message: inner }) => fromInline(model, inner, context),
    Cleared: () => ({
      model: { ...model, inline: Inline.setValue(model.inline, [], context) },
      commands: [],
      outMessages: [OutMessage.Changed({ value: [] })]
    })
  })

export const setValue = (model: Model, value: ReadonlyArray<DateTimeString>, context: DateTimeContext = {}): Model => ({
  ...model,
  inline: Inline.setValue(model.inline, value, context)
})
