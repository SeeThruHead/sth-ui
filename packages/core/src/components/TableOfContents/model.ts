import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { ScrollTo } from "./commands.ts"

export const Heading = Schema.Struct({ depth: Schema.Finite, value: Schema.String, id: Schema.String })

export type Heading = typeof Heading.Type

export const Model = Schema.Struct({
  id: Schema.String,
  headings: Schema.Array(Heading),
  active: Schema.Int,
  initialized: Schema.Boolean,
  generation: Schema.Int
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  headings: [],
  active: -1,
  initialized: false,
  generation: 0
})

export const Message = defineMessageUnion({
  Scanned: { headings: Schema.Array(Heading), active: Schema.Int },
  Scrolled: { active: Schema.Int },
  ScrolledTo: { index: Schema.Int },
  Reinitialized: {},
  CompletedScroll: {}
})

export type Message = typeof Message.Type

export const defaultSelector = "h1, h2, h3, h4, h5, h6"

export type ScrollSpyOptions = { readonly selector?: string; readonly offset?: number; readonly scrollHost?: string }

export type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

export const activeIndex = (tops: ReadonlyArray<number>, offset = 0): number =>
  tops.reduce<{ readonly index: number; readonly position: number }>(
    (closest, top, index) =>
      Math.abs(closest.position - offset) < Math.abs(top - offset) ? closest : { index, position: top },
    { index: -1, position: Number.POSITIVE_INFINITY }
  ).index

const still = (model: Model): Result => ({ model, commands: [] })

export const update = (model: Model, message: Message, options: ScrollSpyOptions = {}): Result =>
  Message.match(message, {
    Scanned: ({ headings, active }) => still({ ...model, headings, active, initialized: true }),
    Scrolled: ({ active }) => still(model.active === active ? model : { ...model, active }),
    ScrolledTo: ({ index }) => ({
      model,
      commands: [
        Command.mapMessage(ScrollTo({ selector: options.selector ?? defaultSelector, index }), () =>
          Message.CompletedScroll()
        )
      ]
    }),
    Reinitialized: () => still({ ...model, generation: model.generation + 1 }),
    CompletedScroll: () => still(model)
  })
