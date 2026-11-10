import * as Animation from "@foldkit/ui/animation"
import { Option } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Animation.Model
export type Model = Animation.Model

export const Message = Animation.Message
export type Message = Animation.Message

export const OutMessage = defineMessageUnion({ Entering: {}, Entered: {}, Exiting: {}, Exited: {} })
export type OutMessage = typeof OutMessage.Type

export const init = (config: { readonly id: string; readonly mounted: boolean }): Model =>
  Animation.init({ id: config.id, isShowing: config.mounted })

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const leaving = (model: Model): boolean =>
  model.transitionState === "LeaveStart" || model.transitionState === "LeaveAnimating"

const lifecycle = (before: Model, after: Model, exited: boolean): ReadonlyArray<OutMessage> => {
  if (exited) return [OutMessage.Exited()]
  if (!before.isShowing && after.isShowing) return [OutMessage.Entering()]
  if (before.isShowing && !after.isShowing) return [OutMessage.Exiting()]

  return before.transitionState === "EnterAnimating" && after.transitionState === "Idle" ? [OutMessage.Entered()] : []
}

export const update = (model: Model, message: Message): Result => {
  const result: ReturnType<typeof Animation.update> = Animation.update(model, message)
  const out = Option.fromNullishOr(result.outMessage)
  const leave = Option.exists(out, (fact) => fact._tag === "StartedLeaveAnimating")
  const exited = Option.exists(out, (fact) => fact._tag === "TransitionedOut")

  return {
    model: result.model,
    commands: [...(result.commands ?? []), ...(leave ? [Animation.defaultLeaveCommand(result.model)] : [])],
    outMessages: lifecycle(model, result.model, exited)
  }
}

export const mounted = (model: Model, mount: boolean): Result =>
  update(model, mount ? Animation.Message.Showed() : Animation.Message.Hid())

export const liftCommands = <M>(commands: ReadonlyArray<Command.Command<Message>>, f: (message: Message) => M) =>
  commands.map((command) => Command.mapMessage(command, f))
