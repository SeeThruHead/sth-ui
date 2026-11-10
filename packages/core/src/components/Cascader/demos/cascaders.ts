import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Cascader from "../Cascader.ts"
import type { CascaderProps } from "../Cascader.ts"
import type { Ui } from "../../../Ui.ts"

const Entry = Schema.Struct({ cascader: Cascader.Model, value: Schema.NullOr(Schema.Array(Schema.String)) })

export const Model = Schema.Record(Schema.String, Entry)
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.String, message: Cascader.Message } })
export type Message = typeof Message.Type

export type Spec = Omit<CascaderProps<Message>, "model" | "toParentMessage" | "value"> & {
  readonly initial?: ReadonlyArray<string>
}

const valueAfter = (value: ReadonlyArray<string> | null, out: Cascader.OutMessage) =>
  out._tag === "Changed" ? out.value : value

export const cascadersDemo = (specs: Readonly<Record<string, Spec>>) => {
  const specOf = (name: string): Spec => specs[name] ?? { data: [] }
  const entryOf = (model: Model, name: string) =>
    model[name] ?? { cascader: Cascader.init({ id: name }), value: specOf(name).initial ?? null }
  const init = (): Model =>
    Object.fromEntries(
      Object.entries(specs).map(([name, spec]) => [
        name,
        {
          cascader: Cascader.init({ id: name, ...(spec.initial === undefined ? {} : { value: spec.initial }) }),
          value: spec.initial ?? null
        }
      ])
    )
  const update = (
    model: Model,
    message: Message
  ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
    const spec = specOf(message.name)
    const entry = entryOf(model, message.name)
    const result = Cascader.update(
      entry.cascader,
      message.message,
      Cascader.cascaderContext({ ...spec, value: entry.value })
    )

    return {
      model: {
        ...model,
        [message.name]: { cascader: result.model, value: result.outMessages.reduce(valueAfter, entry.value) }
      },
      commands: result.commands.map((command) =>
        Command.mapMessage(command, (lifted) => Message.Got({ name: message.name, message: lifted }))
      )
    }
  }
  const cascader = (h: HtmlBuilder<Message>, ui: Ui, model: Model, name: string, extra: Partial<Spec> = {}): Html => {
    const entry = entryOf(model, name)
    const { initial: _initial, ...spec } = specOf(name)

    return ui.Cascader(h, {
      ...spec,
      ...extra,
      model: entry.cascader,
      value: entry.value,
      toParentMessage: (message) => Message.Got({ name, message })
    })
  }

  return { init, update, cascader }
}
