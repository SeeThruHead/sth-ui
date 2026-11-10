import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Transition from "../Transition/model.ts"

export const Model = Transition.Model
export type Model = Transition.Model

export const Message = defineMessageUnion({
  GotTransition: { message: Transition.Message },
  RequestedClose: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Opened: {}, Closed: {}, EnteredTransition: {}, ExitedTransition: {} })
export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string; readonly opened?: boolean }): Model =>
  Transition.init({ id: config.id, mounted: config.opened === true })

const outOf = (out: Transition.OutMessage): ReadonlyArray<OutMessage> =>
  Transition.OutMessage.match(out, {
    Entering: () => [OutMessage.Opened()],
    Entered: () => [OutMessage.EnteredTransition()],
    Exiting: () => [OutMessage.Closed()],
    Exited: () => [OutMessage.ExitedTransition()]
  })

export const gotTransition = (message: Transition.Message): Message => Message.GotTransition({ message })

const lifted = (result: Transition.Result): Result => ({
  model: result.model,
  commands: Transition.liftCommands(result.commands, gotTransition),
  outMessages: result.outMessages.flatMap(outOf)
})

export const open = (model: Model): Result => lifted(Transition.mounted(model, true))

export const close = (model: Model): Result => lifted(Transition.mounted(model, false))

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    GotTransition: ({ message: inner }) => lifted(Transition.update(model, inner)),
    RequestedClose: () => close(model)
  })
