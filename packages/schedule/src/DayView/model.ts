import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Popover from "@foldkit/ui/popover"
import * as Interaction from "./interaction.ts"
import type { InteractionContext } from "./interaction.ts"

export const Model = Schema.Struct({
  interaction: Interaction.Model,
  moreEvents: Popover.Model,
  moreDate: Schema.String,
  agendaOpen: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotInteraction: { message: Interaction.Message },
  GotMoreEvents: { message: Popover.Message },
  ToggledAgenda: {},
  OpenedMoreEvents: { date: Schema.String }
})
export type Message = typeof Message.Type

export const OutMessage = Interaction.OutMessage
export type OutMessage = Interaction.OutMessage

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string }): Model => ({
  interaction: Interaction.init(),
  moreEvents: Popover.init({ id: `${config.id}-more`, isAnimated: true }),
  moreDate: "",
  agendaOpen: false
})

export const gotInteraction = (message: Interaction.Message): Message => Message.GotInteraction({ message })

export const gotMoreEvents = (message: Popover.Message): Message => Message.GotMoreEvents({ message })

const lifted = (model: Model, result: ReturnType<typeof Popover.update>, moreDate: string): Result => ({
  model: { ...model, moreEvents: result.model, moreDate },
  commands: (result.commands ?? []).map((command) => Command.mapMessage(command, gotMoreEvents)),
  outMessages: []
})

export const update = (model: Model, message: Message, context: InteractionContext): Result =>
  Message.match(message, {
    GotInteraction: ({ message: inner }) => {
      const result = Interaction.update(model.interaction, inner, context)

      return { model: { ...model, interaction: result.model }, commands: [], outMessages: result.outMessages }
    },
    GotMoreEvents: ({ message: inner }) => lifted(model, Popover.update(model.moreEvents, inner), model.moreDate),
    OpenedMoreEvents: ({ date }) => lifted(model, Popover.open(model.moreEvents), date),
    ToggledAgenda: () => ({ model: { ...model, agendaOpen: !model.agendaOpen }, commands: [], outMessages: [] })
  })
