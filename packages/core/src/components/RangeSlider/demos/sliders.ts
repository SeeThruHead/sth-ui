import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as RangeSlider from "../RangeSlider.ts"
import type { RangeSliderRules, RangeValue } from "../RangeSlider.ts"

const Range = Schema.Tuple([Schema.Finite, Schema.Finite])

const Entry = Schema.Struct({ slider: RangeSlider.Model, value: Range, ended: Schema.NullOr(Range) })

export const Model = Schema.Struct({ sliders: Schema.Record(Schema.String, Entry), active: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Got: { name: Schema.String, message: RangeSlider.Message },
  GotActive: { message: RangeSlider.Message }
})
export type Message = typeof Message.Type

export type Spec = {
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly value: RangeValue
  readonly rules?: RangeSliderRules
}

type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const changed = (entry: typeof Entry.Type, outMessage: RangeSlider.RangeSliderOutMessage) =>
  RangeSlider.OutMessage.match(outMessage, {
    Changed: ({ value }) => ({ ...entry, value }),
    ChangeEnded: ({ value }) => ({ ...entry, ended: value })
  })

export const sliderDemo = (prefix: string, specs: Readonly<Record<string, Spec>>) => {
  const init = (): Model => ({
    active: "",
    sliders: Object.fromEntries(
      Object.entries(specs).map(([name, spec]) => [
        name,
        {
          slider: RangeSlider.init({
            id: `${prefix}-${name}`,
            ...(spec.min === undefined ? {} : { min: spec.min }),
            ...(spec.max === undefined ? {} : { max: spec.max }),
            ...(spec.step === undefined ? {} : { step: spec.step })
          }),
          value: spec.value,
          ended: null
        }
      ])
    )
  })

  const route = (model: Model, name: string, message: RangeSlider.Message): Result =>
    Option.match(Option.fromNullishOr(model.sliders[name]), {
      onNone: () => ({ model, commands: [] }),
      onSome: (entry) => {
        const result = RangeSlider.update(
          entry.slider,
          message,
          RangeSlider.rangeContext({ ...specs[name]?.rules, value: entry.value })
        )
        const next = result.outMessages.reduce(changed, { ...entry, slider: result.model })

        return {
          model: {
            active: message._tag === "PressedTrack" ? name : model.active,
            sliders: { ...model.sliders, [name]: next }
          },
          commands: result.commands.map((command) =>
            Command.mapMessage(command, (lifted) => Message.Got({ name, message: lifted }))
          )
        }
      }
    })

  const update = (model: Model, message: Message): Result =>
    Message.match(message, {
      Got: ({ name, message: inner }) => route(model, name, inner),
      GotActive: ({ message: inner }) => route(model, model.active, inner)
    })

  const subscriptions = Subscription.lift(RangeSlider.subscriptions)<Model, Message>({
    read: (model) => Option.map(Option.fromNullishOr(model.sliders[model.active]), (entry) => entry.slider),
    toParentMessage: (message) => Message.GotActive({ message })
  })

  const slider = (model: Model, name: string) => {
    const entry = model.sliders[name]

    return {
      ...specs[name]?.rules,
      model: entry?.slider ?? RangeSlider.init({ id: `${prefix}-${name}` }),
      value: entry?.value ?? [0, 0],
      toParentMessage: (message: RangeSlider.Message) => Message.Got({ name, message })
    }
  }

  return { init, update, subscriptions, slider }
}
