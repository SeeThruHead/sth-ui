import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import * as AlphaSlider from "../AlphaSlider.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({
  slider: AlphaSlider.Model,
  value: Schema.Finite,
  ended: Schema.Finite,
  scrubbing: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotSlider: { message: AlphaSlider.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  slider: AlphaSlider.init({ id: "alpha-states" }),
  value: 0.3,
  ended: 0.3,
  scrubbing: false
})

const apply = (model: Model, out: AlphaSlider.OutMessage): Model =>
  AlphaSlider.OutMessage.match(out, {
    Changed: ({ value }) => ({ ...model, value }),
    ChangeEnded: ({ value }) => ({ ...model, ended: value }),
    ScrubStarted: () => ({ ...model, scrubbing: true }),
    ScrubEnded: () => ({ ...model, scrubbing: false })
  })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = AlphaSlider.update(model.slider, message.message, model.value)

  return {
    model: result.outMessages.reduce(apply, { ...model, slider: result.model }),
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (lifted) => Message.GotSlider({ message: lifted }))
    )
  }
}

export const subscriptions = Subscription.lift(AlphaSlider.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.slider),
  toParentMessage: (message) => Message.GotSlider({ message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 300,
    children: [
      ui.Text(h, {
        children: [`Alpha value: ${model.value}, ended ${model.ended}${model.scrubbing ? ", scrubbing" : ""}`]
      }),
      ui.AlphaSlider(h, {
        model: model.slider,
        toParentMessage: (message) => Message.GotSlider({ message }),
        value: model.value,
        color: "#e64980",
        size: "xl",
        focusable: false,
        attributes: { slider: { "aria-label": "Alpha" } }
      })
    ]
  })
