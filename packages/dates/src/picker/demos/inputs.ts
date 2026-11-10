import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { DateString } from "../../date/date.ts"
import * as PickerInput from "../inputModel.ts"
import type { PickerInputOptions } from "../inputModel.ts"
import type { PickerLevel, PickerType } from "../selection.ts"

export const Model = Schema.Record(Schema.String, PickerInput.Model)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.String, message: PickerInput.Message } })
export type Message = typeof Message.Type

export type InputSpec = {
  readonly type?: PickerType
  readonly value?: ReadonlyArray<DateString>
  readonly options?: PickerInputOptions
}

export type Render = (props: {
  readonly model: PickerInput.Model
  readonly toParentMessage: (message: PickerInput.Message) => Message
}) => Html

export const inputsDemo = (level: PickerLevel, today: DateString, specs: Readonly<Record<string, InputSpec>>) => {
  const fresh = (name: string) => {
    const spec = specs[name] ?? {}

    return PickerInput.init({
      id: name,
      today,
      level,
      ...(spec.type === undefined ? {} : { type: spec.type }),
      ...(spec.value === undefined ? {} : { value: spec.value })
    })
  }
  const init = (): Model => Object.fromEntries(Object.keys(specs).map((name) => [name, fresh(name)]))
  const update = (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const result = PickerInput.update(
      model[message.name] ?? fresh(message.name),
      message.message,
      specs[message.name]?.options
    )

    return {
      model: { ...model, [message.name]: result.model },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.Got({ name: message.name, message: lifted }))
      )
    }
  }
  const input = (model: Model, name: string, render: Render): Html =>
    render({ model: model[name] ?? fresh(name), toParentMessage: (message) => Message.Got({ name, message }) })

  return { init, update, input }
}
