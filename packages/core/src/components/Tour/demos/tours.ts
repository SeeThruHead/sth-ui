import { Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Tour from "../Tour.ts"
import type { TourProps, TourStep } from "../Tour.ts"

export const Model = Schema.Struct({ tour: Tour.Model, events: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotTour: { message: Tour.Message } })
export type Message = typeof Message.Type

const eventOf = (out: Tour.OutMessage) =>
  Tour.OutMessage.match(out, {
    StepChanged: ({ step }) => `changed ${step}`,
    StepOpened: ({ step }) => `opened ${step}`,
    StepClosed: ({ step }) => `closed ${step}`,
    Closed: () => "closed"
  })

export type TourOptions = Omit<TourProps<Message>, "model" | "toParentMessage" | "steps">

export const tourDemo = (
  id: string,
  steps: ReadonlyArray<TourStep>,
  options: TourOptions = {},
  defaultStep?: number
) => {
  const context = Tour.tourContext({ steps, ...options })

  return {
    init: (): Model => ({ tour: Tour.init({ id, ...(defaultStep === undefined ? {} : { defaultStep }) }), events: [] }),
    update: (
      model: Model,
      message: Message
    ): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
      const result = Tour.update(model.tour, message.message, context)

      return {
        model: { tour: result.model, events: [...model.events, ...result.outMessages.map(eventOf)] },
        commands: []
      }
    },
    tour: (model: Model) => ({
      ...options,
      model: model.tour,
      steps,
      toParentMessage: (message: Tour.Message) => Message.GotTour({ message })
    }),
    start: Message.GotTour({ message: Tour.Message.Started() }),
    startAt: (step: number) => Message.GotTour({ message: Tour.Message.StartedAt({ step }) }),
    toggle: (model: Model) =>
      Message.GotTour({ message: model.tour.active ? Tour.Message.Ended() : Tour.Message.Started() })
  }
}
