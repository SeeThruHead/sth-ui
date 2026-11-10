import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { ComboboxData, ComboboxItem } from "../../Combobox/Combobox.ts"
import * as ComboboxPopover from "../ComboboxPopover.ts"
import type { Ui } from "../../../Ui.ts"

const Value = Schema.Union([Schema.NullOr(Schema.String), Schema.Array(Schema.String)])

const Entry = Schema.Struct({ popover: ComboboxPopover.Model, value: Value })

export const Model = Schema.Record(Schema.String, Entry)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.String, message: ComboboxPopover.Message } })
export type Message = typeof Message.Type

export type Spec = {
  readonly data: ComboboxData
  readonly value?: ComboboxPopover.ComboboxPopoverValue
  readonly multiple?: boolean
  readonly allowDeselect?: boolean
  readonly searchable?: boolean
  readonly limit?: number
  readonly filter?: (query: string, item: ComboboxItem) => boolean
}

const emptyValue = (spec: Spec): ComboboxPopover.ComboboxPopoverValue =>
  spec.value ?? (spec.multiple === true ? [] : null)

const entryOf = (model: Model, name: string, spec: Spec) =>
  model[name] ?? { popover: ComboboxPopover.init({ id: name }), value: emptyValue(spec) }

const contextOf = (spec: Spec, entry: typeof Entry.Type): ComboboxPopover.ComboboxPopoverContext => ({
  options: ComboboxPopover.optionsOf({ ...spec, model: entry.popover }),
  value: entry.value,
  ...(spec.multiple === undefined ? {} : { multiple: spec.multiple }),
  ...(spec.allowDeselect === undefined ? {} : { allowDeselect: spec.allowDeselect }),
  ...(spec.searchable === undefined ? {} : { searchable: spec.searchable })
})

const valueAfter = (value: ComboboxPopover.ComboboxPopoverValue, out: ComboboxPopover.OutMessage) => {
  if (out._tag === "Changed") return out.value
  if (out._tag === "ChangedMany") return out.value

  return value
}

export const popoversDemo = (specs: Readonly<Record<string, Spec>>) => {
  const specOf = (name: string): Spec => specs[name] ?? { data: [] }
  const init = (): Model =>
    Object.fromEntries(
      Object.entries(specs).map(([name, spec]) => [
        name,
        { popover: ComboboxPopover.init({ id: name }), value: emptyValue(spec) }
      ])
    )
  const update = (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const spec = specOf(message.name)
    const entry = entryOf(model, message.name, spec)
    const result = ComboboxPopover.update(entry.popover, message.message, contextOf(spec, entry))

    return {
      model: {
        ...model,
        [message.name]: { popover: result.model, value: result.outMessages.reduce(valueAfter, entry.value) }
      },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.Got({ name: message.name, message: lifted }))
      )
    }
  }
  const valueOf = (model: Model, name: string) => entryOf(model, name, specOf(name)).value
  const popover = (
    h: HtmlBuilder<Message>,
    ui: Ui,
    model: Model,
    name: string,
    target: (bind: ReadonlyArray<ChildAttribute>, value: ComboboxPopover.ComboboxPopoverValue) => Html,
    extra: Partial<ComboboxPopover.ComboboxPopoverProps<Message>> = {}
  ): Html => {
    const spec = specOf(name)
    const entry = entryOf(model, name, spec)

    return ui.ComboboxPopover(h, {
      ...spec,
      ...extra,
      model: entry.popover,
      value: entry.value,
      toParentMessage: (inner) => Message.Got({ name, message: inner }),
      target: (bind) => target(bind, entry.value)
    })
  }

  return { init, update, valueOf, popover }
}

export const shown = (value: ComboboxPopover.ComboboxPopoverValue, empty: string): string => {
  if (value === null) return empty
  if (typeof value === "string") return value

  return value.length > 0 ? value.join(", ") : empty
}
