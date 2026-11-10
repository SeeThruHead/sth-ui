import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { FocusIndicator, Wait } from "./commands.ts"
import { byIndex, clampTo, engineOf, normalizeIndex, released, settle, valueAt } from "./engine.ts"
import type { Direction, Engine, EngineOptions, Target } from "./engine.ts"

const SlideBox = Schema.Struct({ start: Schema.Finite, size: Schema.Finite })

export const Layout = Schema.Struct({ view: Schema.Finite, slides: Schema.Array(SlideBox), endGap: Schema.Finite })

export const Model = Schema.Struct({
  id: Schema.String,
  layout: Schema.Option(Layout),
  index: Schema.Int,
  location: Schema.Finite,
  dragStart: Schema.Option(Schema.Finite),
  animating: Schema.Boolean,
  generation: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Measured: { layout: Layout },
  RequestedNext: {},
  RequestedPrevious: {},
  RequestedSlide: { index: Schema.Int },
  PressedIndicatorKey: { index: Schema.Int, key: Schema.String, vertical: Schema.Boolean },
  DragMoved: { delta: Schema.Finite },
  DragEnded: { velocity: Schema.Finite, pointer: Schema.Literals(["mouse", "touch"]) },
  Settled: { generation: Schema.Int },
  FocusedIndicator: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  SlideChanged: { index: Schema.Int },
  NextSlide: {},
  PreviousSlide: {}
})
export type OutMessage = typeof OutMessage.Type

export type CarouselContext = EngineOptions & { readonly initialSlide?: number; readonly duration?: number }

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  layout: Option.none(),
  index: 0,
  location: 0,
  dragStart: Option.none(),
  animating: false,
  generation: 0
})

export const engineFor = (model: Model, context: CarouselContext): Option.Option<Engine> =>
  Option.map(model.layout, (layout) => engineOf(layout, context))

export const indicatorId = (model: Model, index: number) => `${model.id}-indicator-${index}`

export const settled = (generation: number) => (): Message => Message.Settled({ generation })

export const focusedIndicator = (): Message => Message.FocusedIndicator()

const none = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const measured = (model: Model, layout: typeof Layout.Type, context: CarouselContext): Result => {
  const engine = engineOf(layout, context)
  const index = normalizeIndex(
    engine,
    Option.isNone(model.layout) ? (context.initialSlide ?? model.index) : model.index
  )

  return none({
    ...model,
    layout: Option.some(layout),
    index,
    location: valueAt(engine.scrollSnaps, index),
    animating: false
  })
}

const moved = (model: Model, engine: Engine, target: Target, context: CarouselContext): Result => {
  const location = model.location + target.distance
  const generation = model.generation + 1

  return {
    model: {
      ...model,
      index: target.index,
      location: engine.loop ? location : clampTo(engine.limit, location),
      dragStart: Option.none(),
      animating: true,
      generation
    },
    commands: [Command.mapMessage(Wait({ millis: context.duration ?? 400 }), settled(generation))],
    outMessages: target.index === model.index ? [] : [OutMessage.SlideChanged({ index: target.index })]
  }
}

const withEngine = (model: Model, context: CarouselContext, step: (engine: Engine) => Result): Result =>
  Option.match(engineFor(model, context), { onNone: () => none(model), onSome: step })

const scrollBy = (model: Model, context: CarouselContext, step: 1 | -1): Result =>
  withEngine(model, context, (engine) => {
    const direction: Direction = step === 1 ? -1 : 1

    return moved(
      model,
      engine,
      byIndex(engine, normalizeIndex(engine, model.index + step), direction, model.location),
      context
    )
  })

const scrollTo = (model: Model, context: CarouselContext, index: number): Result =>
  withEngine(model, context, (engine) =>
    moved(model, engine, byIndex(engine, normalizeIndex(engine, index), 0, model.location), context)
  )

const indicatorTarget = (key: string, index: number, count: number, vertical: boolean) => {
  if (key === (vertical ? "ArrowDown" : "ArrowRight")) return Option.some(index < count - 1 ? index + 1 : 0)
  if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return Option.some(index > 0 ? index - 1 : count - 1)
  if (key === "Home") return Option.some(0)

  return key === "End" ? Option.some(count - 1) : Option.none()
}

const pressedIndicator = (
  model: Model,
  context: CarouselContext,
  message: Extract<Message, { readonly _tag: "PressedIndicatorKey" }>
) =>
  withEngine(model, context, (engine) =>
    Option.match(indicatorTarget(message.key, message.index, engine.scrollSnaps.length, message.vertical), {
      onNone: () => none(model),
      onSome: (index) => {
        const result = scrollTo(model, context, index)
        const focus = Command.mapMessage(
          FocusIndicator({ selector: `#${indicatorId(model, index)}` }),
          focusedIndicator
        )

        return { ...result, commands: [...result.commands, focus] }
      }
    })
  )

export const update = (model: Model, message: Message, context: CarouselContext = {}): Result =>
  Message.match(message, {
    Measured: ({ layout }) => measured(model, layout, context),
    RequestedNext: () => {
      const result = scrollBy(model, context, 1)

      return { ...result, outMessages: [...result.outMessages, OutMessage.NextSlide()] }
    },
    RequestedPrevious: () => {
      const result = scrollBy(model, context, -1)

      return { ...result, outMessages: [...result.outMessages, OutMessage.PreviousSlide()] }
    },
    RequestedSlide: ({ index }) => scrollTo(model, context, index),
    PressedIndicatorKey: (pressed) => pressedIndicator(model, context, pressed),
    DragMoved: ({ delta }) => {
      const start = Option.getOrElse(model.dragStart, () => model.location)

      return none({ ...model, dragStart: Option.some(start), location: start + delta, animating: false })
    },
    DragEnded: ({ velocity, pointer }) =>
      Option.isNone(model.dragStart)
        ? none(model)
        : withEngine(model, context, (engine) =>
            moved(model, engine, released(engine, context, model.index, model.location, { velocity, pointer }), context)
          ),
    Settled: ({ generation }) =>
      generation !== model.generation
        ? none(model)
        : withEngine(model, context, (engine) =>
            none({ ...model, location: settle(engine, model.location), animating: false })
          ),
    FocusedIndicator: () => none(model)
  })

export const canScrollPrevious = (model: Model, context: CarouselContext = {}): boolean =>
  Option.match(engineFor(model, context), {
    onNone: () => false,
    onSome: (engine) => (engine.loop ? engine.scrollSnaps.length > 1 : model.index > 0)
  })

export const canScrollNext = (model: Model, context: CarouselContext = {}): boolean =>
  Option.match(engineFor(model, context), {
    onNone: () => false,
    onSome: (engine) => (engine.loop ? engine.scrollSnaps.length > 1 : model.index < engine.scrollSnaps.length - 1)
  })

export const slideCount = (model: Model, context: CarouselContext = {}): number =>
  Option.match(engineFor(model, context), { onNone: () => 0, onSome: (engine) => engine.scrollSnaps.length })

export const next = (): Message => Message.RequestedNext()

export const previous = (): Message => Message.RequestedPrevious()

export const scrollToSlide = (index: number): Message => Message.RequestedSlide({ index })
