import { Array as Arr, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as AngleSlider from "../AngleSlider.ts"
import type { AngleSliderProps } from "../AngleSlider.ts"
import type { Ui } from "../../../Ui.ts"

type Entry = Omit<AngleSliderProps<Message>, "model" | "toParentMessage" | "value"> & { readonly id: string }

const entries: ReadonlyArray<Entry> = [{ id: "disabled", ariaLabel: "Angle slider", disabled: true, name: "angle" }]

export const Model = Schema.Struct({
  sliders: Schema.Array(AngleSlider.Model),
  values: Schema.Array(Schema.Finite),
  ended: Schema.Finite
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSlider: { index: Schema.Int, message: AngleSlider.Message },
  GotDragged: { message: AngleSlider.Message }
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  sliders: entries.map((entry) => AngleSlider.init({ id: entry.id })),
  values: entries.map(() => 0),
  ended: 0
})

type Step = { readonly slider: AngleSlider.Model; readonly value: number; readonly ended: Option.Option<number> }

const step = (entry: Entry, slider: AngleSlider.Model, value: number, message: AngleSlider.Message): Step => {
  const result = AngleSlider.update(slider, message, AngleSlider.angleSliderContext({ ...entry, value }))

  return result.outMessages.reduce<Step>(
    (state, out) =>
      AngleSlider.OutMessage.match(out, {
        Changed: (changed) => ({ ...state, value: changed.value }),
        ChangeEnded: (ended) => ({ ...state, ended: Option.some(ended.value) }),
        ScrubStarted: () => state,
        ScrubEnded: () => state
      }),
    { slider: result.model, value, ended: Option.none() }
  )
}

const stepAt = (model: Model, index: number, message: AngleSlider.Message): Model => {
  const steps = Arr.zip(entries, Arr.zip(model.sliders, model.values)).map(([entry, [slider, value]], at) =>
    at === index ? step(entry, slider, value, message) : { slider, value, ended: Option.none() }
  )

  return {
    sliders: steps.map((done) => done.slider),
    values: steps.map((done) => done.value),
    ended: steps.reduce((ended, done) => Option.getOrElse(done.ended, () => ended), model.ended)
  }
}

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    GotSlider: ({ index, message: inner }) => stepAt(model, index, inner),
    GotDragged: ({ message: inner }) =>
      stepAt(
        model,
        model.sliders.findIndex((slider) => slider.dragging),
        inner
      )
  }),
  commands: []
})

export const subscriptions = Subscription.lift(AngleSlider.subscriptions)<Model, Message>({
  read: (model) => Option.fromNullishOr(model.sliders.find((slider) => slider.dragging)),
  toParentMessage: (message) => Message.GotDragged({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Group(h, {
    children: Arr.zip(entries, Arr.zip(model.sliders, model.values)).map(([entry, [slider, value]], index) =>
      ui.AngleSlider(h, {
        ...entry,
        model: slider,
        value,
        toParentMessage: (message) => Message.GotSlider({ index, message })
      })
    )
  })
