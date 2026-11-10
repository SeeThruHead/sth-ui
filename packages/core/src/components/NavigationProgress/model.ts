import { Duration, Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const Model = Schema.Struct({
  progress: Schema.Finite,
  mounted: Schema.Boolean,
  running: Schema.Boolean,
  generation: Schema.Int,
  step: Schema.Finite,
  stepInterval: Schema.Finite
})

export type Model = typeof Model.Type

export const init = (config: { readonly initialProgress?: number; readonly stepInterval?: number } = {}): Model => ({
  progress: config.initialProgress ?? 0,
  mounted: false,
  running: false,
  generation: 0,
  step: 1,
  stepInterval: config.stepInterval ?? 500
})

export const Message = defineMessageUnion({
  Started: {},
  Stopped: {},
  Reset: {},
  Set: { value: Schema.Finite },
  Incremented: {},
  Decremented: {},
  Completed: {},
  Ticked: { generation: Schema.Int },
  Hid: { generation: Schema.Int },
  Cleared: { generation: Schema.Int, full: Schema.Boolean }
})

export type Message = typeof Message.Type

export const Tick = Command.define("NavigationProgressTick", {
  args: { generation: Schema.Int, delay: Schema.Finite },
  messages: [Message.Ticked],
  execute: ({ generation, delay }) =>
    Effect.sleep(Duration.millis(delay)).pipe(Effect.as(Message.Ticked({ generation })))
})

export const HideAfter = Command.define("NavigationProgressHideAfter", {
  args: { generation: Schema.Int, delay: Schema.Finite },
  messages: [Message.Hid],
  execute: ({ generation, delay }) => Effect.sleep(Duration.millis(delay)).pipe(Effect.as(Message.Hid({ generation })))
})

export const ClearAfter = Command.define("NavigationProgressClearAfter", {
  args: { generation: Schema.Int, delay: Schema.Finite, full: Schema.Boolean },
  messages: [Message.Cleared],
  execute: ({ generation, delay, full }) =>
    Effect.sleep(Duration.millis(delay)).pipe(Effect.as(Message.Cleared({ generation, full })))
})

const steps: ReadonlyArray<readonly [number, number]> = [
  [20, 10],
  [50, 4],
  [80, 2],
  [99, 1],
  [100, 0]
]

export const nextProgress = (progress: number): number => {
  const step = steps.find(([upTo]) => progress >= 0 && progress <= upTo)

  return progress + (step === undefined ? 0.5 : step[1])
}

type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const still = (model: Model): Result => ({ model, commands: [] })

const reset = (model: Model): Model => ({
  ...model,
  progress: 0,
  mounted: false,
  running: false,
  generation: model.generation + 1
})

const ticked = (model: Model): Result => ({
  model: { ...model, progress: nextProgress(model.progress), mounted: true },
  commands: [Tick({ generation: model.generation, delay: model.stepInterval })]
})

const incremented = (model: Model): Result => {
  const progress = Math.min(model.progress + model.step, 100)
  if (progress !== 100 && progress !== 0) return still({ ...model, progress, mounted: true })

  return {
    model: { ...model, progress, mounted: false },
    commands: [ClearAfter({ generation: model.generation, delay: model.stepInterval + 50, full: true })]
  }
}

const isCurrent = (model: Model, generation: number): boolean => generation === model.generation

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    Started: () => ticked({ ...model, running: true, generation: model.generation + 1 }),
    Ticked: ({ generation }) => (isCurrent(model, generation) && model.running ? ticked(model) : still(model)),
    Stopped: () => still({ ...model, running: false, generation: model.generation + 1 }),
    Reset: () => still(reset(model)),
    Set: ({ value }) => still({ ...model, progress: Math.min(100, Math.max(0, value)), mounted: true }),
    Incremented: () => incremented(model),
    Decremented: () => still({ ...model, progress: Math.max(model.progress - model.step, 0) }),
    Completed: () => {
      const generation = model.generation + 1

      return {
        model: { ...model, progress: 100, running: false, generation },
        commands: [
          HideAfter({ generation, delay: 50 }),
          ClearAfter({ generation, delay: model.stepInterval + 50, full: false })
        ]
      }
    },
    Hid: ({ generation }) => still(isCurrent(model, generation) ? { ...model, mounted: false } : model),
    Cleared: ({ generation, full }) => {
      if (!isCurrent(model, generation)) return still(model)

      return still(full ? reset(model) : { ...model, progress: 0 })
    }
  })
