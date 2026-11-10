import * as FoldkitTooltip from "@foldkit/ui/tooltip"
import { Duration, Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({
  tooltip: FoldkitTooltip.Model,
  closeDelay: Schema.Finite,
  interactive: Schema.Boolean,
  pendingCloseVersion: Schema.Int,
  pendingClose: Schema.NullOr(Schema.Literals(["LeftTrigger", "BlurredTrigger"]))
})

export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotTooltip: { message: FoldkitTooltip.Message },
  CompletedWaitBeforeClosing: { version: Schema.Int },
  EnteredPanel: {},
  LeftPanel: {}
})

export type Message = typeof Message.Type

export const OutMessage = FoldkitTooltip.OutMessage

export type OutMessage = FoldkitTooltip.OutMessage

export type InitConfig = {
  readonly id: string
  readonly openDelay?: Duration.Input
  readonly closeDelay?: number
  readonly interactive?: boolean
}

export const interactiveGrace = 100

export const init = (config: InitConfig): Model => ({
  tooltip: FoldkitTooltip.init({ id: config.id, showDelay: config.openDelay ?? 0 }),
  closeDelay: config.closeDelay ?? 0,
  interactive: config.interactive === true,
  pendingCloseVersion: 0,
  pendingClose: null
})

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage | undefined
}

export const WaitBeforeClosing = Command.define("TooltipWaitBeforeClosing", {
  args: { delay: Schema.Finite, version: Schema.Int },
  messages: [Message.CompletedWaitBeforeClosing],
  execute: ({ delay, version }) =>
    Effect.sleep(Duration.millis(delay)).pipe(Effect.as(Message.CompletedWaitBeforeClosing({ version })))
})

const gotTooltip = (message: FoldkitTooltip.Message): Message => Message.GotTooltip({ message })

const forwarded = (model: Model, message: FoldkitTooltip.Message): Result => {
  const result = FoldkitTooltip.update(model.tooltip, message)

  return {
    model: { ...model, tooltip: result.model },
    commands: (result.commands ?? []).map((command) => Command.mapMessage(command, gotTooltip)),
    outMessage: result.outMessage
  }
}

const closeWait = (model: Model): number =>
  model.interactive ? Math.max(model.closeDelay, interactiveGrace) : model.closeDelay

const cancelled = (model: Model): Model => ({
  ...model,
  pendingCloseVersion: model.pendingCloseVersion + 1,
  pendingClose: null
})

const deferred = (model: Model, close: "LeftTrigger" | "BlurredTrigger"): Result => {
  const version = model.pendingCloseVersion + 1

  return {
    model: { ...model, pendingCloseVersion: version, pendingClose: close },
    commands: [WaitBeforeClosing({ delay: closeWait(model), version })]
  }
}

const closing = (model: Model, close: "LeftTrigger" | "BlurredTrigger"): Result => {
  if (!model.tooltip.isOpen) return forwarded(model, FoldkitTooltip.Message[close]())
  if (closeWait(model) === 0) return forwarded(model, FoldkitTooltip.Message[close]())

  return deferred(model, close)
}

const fromTooltip = (model: Model, message: FoldkitTooltip.Message): Result => {
  if (message._tag === "LeftTrigger") return closing(model, "LeftTrigger")
  if (message._tag === "BlurredTrigger") return closing(model, "BlurredTrigger")
  if (message._tag === "EnteredTrigger") return forwarded(cancelled(model), message)
  if (message._tag === "FocusedTrigger") return forwarded(cancelled(model), message)

  return forwarded(model, message)
}

const completed = (model: Model, version: number): Result => {
  if (version !== model.pendingCloseVersion) return { model, commands: [] }

  return Option.match(Option.fromNullishOr(model.pendingClose), {
    onNone: () => ({ model, commands: [] }),
    onSome: (close) => forwarded({ ...model, pendingClose: null }, FoldkitTooltip.Message[close]())
  })
}

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    GotTooltip: ({ message: inner }) => fromTooltip(model, inner),
    CompletedWaitBeforeClosing: ({ version }) => completed(model, version),
    EnteredPanel: () => ({ model: cancelled(model), commands: [] }),
    LeftPanel: () => (model.interactive ? closing(model, "LeftTrigger") : { model, commands: [] })
  })

export const isOpen = (model: Model): boolean => model.tooltip.isOpen

export type GroupDelays = { readonly openDelay: number; readonly closeDelay: number }

const closedNow = (model: Model): Result =>
  model.pendingClose === null ? { model, commands: [] } : completed(model, model.pendingCloseVersion)

export const updateGroup = (
  models: ReadonlyArray<Model>,
  index: number,
  message: Message,
  delays: GroupDelays
): ReadonlyArray<Result> => {
  const anotherOpen = models.some((model, at) => at !== index && isOpen(model))
  const target = Option.getOrThrow(Option.fromNullishOr(models[index]))
  const result = update(
    {
      ...target,
      closeDelay: delays.closeDelay,
      tooltip: FoldkitTooltip.reflectShowDelay(target.tooltip, anotherOpen ? 0 : delays.openDelay)
    },
    message
  )
  const shown = result.outMessage?._tag === "Shown"

  return models.map((model, at) => {
    if (at === index) return result
    if (!shown) return { model, commands: [] }

    return closedNow(model)
  })
}

export const FloatingModel = Schema.Struct({ id: Schema.String, opened: Schema.Boolean })

export type FloatingModel = typeof FloatingModel.Type

export const FloatingMessage = defineMessageUnion({ Entered: {}, Left: {} })

export type FloatingMessage = typeof FloatingMessage.Type

export const initFloating = (config: { readonly id: string }): FloatingModel => ({ id: config.id, opened: false })

export const updateFloating = (model: FloatingModel, message: FloatingMessage): FloatingModel =>
  FloatingMessage.match(message, {
    Entered: () => ({ ...model, opened: true }),
    Left: () => ({ ...model, opened: false })
  })
