import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "@foldkit/ui/popover"

export const Model = Schema.Struct({
  popover: Popover.Model,
  search: Schema.String,
  active: Schema.NullOr(Schema.String)
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  popover: Popover.init({ id: config.id, isAnimated: true }),
  search: "",
  active: null
})

export const Direction = Schema.Literals(["next", "previous"])

export type Direction = typeof Direction.Type

export const Message = defineMessageUnion({
  GotPopover: { message: Popover.Message },
  Searched: { value: Schema.String },
  Moved: { direction: Direction },
  Chose: { value: Schema.String },
  PressedEnter: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.NullOr(Schema.String) },
  ChangedMany: { value: Schema.Array(Schema.String) },
  OptionSubmitted: { value: Schema.String },
  Opened: {},
  Closed: {},
  SearchChanged: { value: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type ComboboxPopoverValue = string | null | ReadonlyArray<string>

export type ComboboxPopoverContext = {
  readonly options: ReadonlyArray<string>
  readonly value: ComboboxPopoverValue
  readonly multiple?: boolean
  readonly allowDeselect?: boolean
  readonly searchable?: boolean
  readonly selectFirstOptionOnDropdownOpen?: boolean
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

type PopoverResult = ReturnType<typeof Popover.update>

export const gotPopover = (message: Popover.Message): Message => Message.GotPopover({ message })

const lifted = (model: Model, result: PopoverResult, context: ComboboxPopoverContext): Result => {
  const commands = (result.commands ?? []).map((command) => Command.mapMessage(command, gotPopover))
  const popover = { ...model, popover: result.model }
  if (result.outMessage?._tag === "Opened")
    return {
      model: {
        ...popover,
        active: context.selectFirstOptionOnDropdownOpen === true ? Option.getOrNull(Arr.head(context.options)) : null
      },
      commands,
      outMessages: [OutMessage.Opened()]
    }
  if (result.outMessage?._tag === "Closed")
    return { model: { ...popover, active: null }, commands, outMessages: [OutMessage.Closed()] }

  return { model: popover, commands, outMessages: [] }
}

const still = (model: Model, outMessages: ReadonlyArray<OutMessage> = []): Result => ({
  model,
  commands: [],
  outMessages
})

const moved = (options: ReadonlyArray<string>, active: string | null, direction: Direction): string | null => {
  if (options.length === 0) return null
  const index = active === null ? -1 : options.indexOf(active)
  const step = direction === "next" ? 1 : -1
  const start = index === -1 && direction === "previous" ? 0 : index

  return Option.getOrNull(Arr.get(options, (start + step + options.length) % options.length))
}

const toggled = (value: ComboboxPopoverValue, option: string): ReadonlyArray<string> => {
  const current = Array.isArray(value) ? value : []

  return current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
}

const searchReset = (model: Model, context: ComboboxPopoverContext): readonly [Model, ReadonlyArray<OutMessage>] =>
  context.searchable === true ? [{ ...model, search: "" }, [OutMessage.SearchChanged({ value: "" })]] : [model, []]

const submitted = (model: Model, option: string, context: ComboboxPopoverContext): Result => {
  const [searched, searchOut] = searchReset(model, context)
  if (context.multiple === true)
    return still({ ...searched, active: option }, [
      OutMessage.OptionSubmitted({ value: option }),
      OutMessage.ChangedMany({ value: toggled(context.value, option) }),
      ...searchOut
    ])
  const deselect = context.allowDeselect !== false && context.value === option
  const closed = lifted(searched, Popover.close(searched.popover), context)

  return {
    ...closed,
    outMessages: [
      OutMessage.OptionSubmitted({ value: option }),
      OutMessage.Changed({ value: deselect ? null : option }),
      ...closed.outMessages,
      ...searchOut
    ]
  }
}

export const update = (model: Model, message: Message, context: ComboboxPopoverContext): Result =>
  Message.match(message, {
    GotPopover: ({ message: inner }) => lifted(model, Popover.update(model.popover, inner), context),
    Searched: ({ value }) => still({ ...model, search: value, active: null }, [OutMessage.SearchChanged({ value })]),
    Moved: ({ direction }) => still({ ...model, active: moved(context.options, model.active, direction) }),
    Chose: ({ value }) => submitted(model, value, context),
    PressedEnter: () => (model.active === null ? still(model) : submitted(model, model.active, context))
  })
