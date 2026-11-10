import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Modal from "../Modal/model.ts"
import { orderedActions, shownActions } from "./filter.ts"
import type { SpotlightActionData, SpotlightOptions } from "./filter.ts"
import { Reveal } from "./reveal.ts"

export const Model = Schema.Struct({
  id: Schema.String,
  modal: Modal.Model,
  query: Schema.String,
  selected: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Opened: {},
  Closed: {},
  Toggled: {},
  ChangedQuery: { query: Schema.String },
  SelectedNext: {},
  SelectedPrevious: {},
  TriggeredSelected: {},
  ClickedAction: { id: Schema.String },
  GotModal: { message: Modal.Message },
  CompletedReveal: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  SpotlightOpened: {},
  SpotlightClosed: {},
  QueryChanged: { query: Schema.String },
  ActionTriggered: { id: Schema.String }
})
export type OutMessage = typeof OutMessage.Type

export type SpotlightContext = SpotlightOptions & {
  readonly clearQueryOnClose?: boolean
  readonly closeOnActionTrigger?: boolean
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string; readonly opened?: boolean; readonly query?: string }): Model => ({
  id: config.id,
  modal: Modal.init({ id: `${config.id}-modal`, opened: config.opened === true }),
  query: config.query ?? "",
  selected: -1
})

export const actionId = (model: Model, index: number) => `${model.id}-action-${index}`

export const listId = (model: Model) => `${model.id}-actions`

export const searchId = (model: Model) => `${model.id}-search`

export const gotModal = (message: Modal.Message): Message => Message.GotModal({ message })

export const completedReveal = (): Message => Message.CompletedReveal()

export const actionsOf = (model: Model, context: SpotlightContext): ReadonlyArray<SpotlightActionData> =>
  orderedActions(shownActions(model.query, context))

const outOf = (out: Modal.OutMessage): ReadonlyArray<OutMessage> =>
  Modal.OutMessage.match(out, {
    Opened: () => [OutMessage.SpotlightOpened()],
    Closed: () => [OutMessage.SpotlightClosed()],
    EnteredTransition: () => [],
    ExitedTransition: () => []
  })

const cleared = (model: Model, context: SpotlightContext): Result => {
  const clear = context.clearQueryOnClose ?? true
  const changed = clear && model.query !== ""

  return {
    model: { ...model, selected: -1, query: clear ? "" : model.query },
    commands: [],
    outMessages: changed ? [OutMessage.QueryChanged({ query: "" })] : []
  }
}

const fromModal = (model: Model, result: Modal.Result, context: SpotlightContext): Result => {
  const next = {
    model: { ...model, modal: result.model },
    commands: result.commands.map((command) => Command.mapMessage(command, gotModal)),
    outMessages: result.outMessages.flatMap(outOf)
  }
  if (!result.outMessages.some((out) => out._tag === "ExitedTransition")) return next
  const reset = cleared(next.model, context)

  return { ...reset, commands: next.commands, outMessages: [...next.outMessages, ...reset.outMessages] }
}

const opened = (model: Model, context: SpotlightContext): Result =>
  fromModal({ ...model, selected: -1 }, Modal.open(model.modal), context)

const closed = (model: Model, context: SpotlightContext): Result => fromModal(model, Modal.close(model.modal), context)

export const selectIndex = (index: number, count: number): number => {
  const next = index === -1 ? count - 1 : index === count ? 0 : index

  return Math.min(Math.max(next, 0), count - 1)
}

const selecting = (model: Model, index: number, context: SpotlightContext): Result => {
  const selected = selectIndex(index, actionsOf(model, context).length)

  return {
    model: { ...model, selected },
    commands: selected === -1 ? [] : [Command.mapMessage(Reveal({ id: actionId(model, selected) }), completedReveal)],
    outMessages: []
  }
}

const triggered = (model: Model, action: SpotlightActionData, context: SpotlightContext): Result => {
  const triggeredOut = [OutMessage.ActionTriggered({ id: action.id })]
  if (!(action.closeSpotlightOnTrigger ?? context.closeOnActionTrigger ?? true)) {
    return { model, commands: [], outMessages: triggeredOut }
  }
  const result = closed(model, context)

  return { ...result, outMessages: [...triggeredOut, ...result.outMessages] }
}

const triggering = (model: Model, action: Option.Option<SpotlightActionData>, context: SpotlightContext): Result =>
  Option.match(action, {
    onNone: () => ({ model, commands: [], outMessages: [] }),
    onSome: (found) => triggered(model, found, context)
  })

export const update = (model: Model, message: Message, context: SpotlightContext = {}): Result =>
  Message.match(message, {
    Opened: () => opened(model, context),
    Closed: () => closed(model, context),
    Toggled: () => (model.modal.isShowing ? closed(model, context) : opened(model, context)),
    ChangedQuery: ({ query }) => {
      const result = selecting({ ...model, query }, 0, context)

      return { ...result, outMessages: [OutMessage.QueryChanged({ query })] }
    },
    SelectedNext: () => selecting(model, model.selected + 1, context),
    SelectedPrevious: () => selecting(model, model.selected - 1, context),
    TriggeredSelected: () =>
      triggering(model, Option.fromNullishOr(actionsOf(model, context)[model.selected]), context),
    ClickedAction: ({ id }) =>
      triggering(model, Option.fromNullishOr(actionsOf(model, context).find((action) => action.id === id)), context),
    GotModal: ({ message: inner }) => fromModal(model, Modal.update(model.modal, inner), context),
    CompletedReveal: () => ({ model, commands: [], outMessages: [] })
  })

export const open = (): Message => Message.Opened()

export const close = (): Message => Message.Closed()

export const toggle = (): Message => Message.Toggled()

export const isOpened = (model: Model): boolean => model.modal.isShowing
