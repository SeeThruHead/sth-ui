import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { HideAfterDelay, ScrollViewport } from "./commands.ts"

export const Metrics = Schema.Struct({
  scrollTop: Schema.Finite,
  scrollLeft: Schema.Finite,
  scrollHeight: Schema.Finite,
  scrollWidth: Schema.Finite,
  clientHeight: Schema.Finite,
  clientWidth: Schema.Finite
})

export type Metrics = typeof Metrics.Type

export const Axis = Schema.Literals(["x", "y"])

export type Axis = typeof Axis.Type

export const Track = Schema.Struct({
  start: Schema.Finite,
  size: Schema.Finite,
  paddingStart: Schema.Finite,
  paddingEnd: Schema.Finite
})

export type Track = typeof Track.Type

export const Drag = Schema.Struct({ axis: Axis, offset: Schema.Finite, track: Track })

export type Drag = typeof Drag.Type

export const Edges = Schema.Struct({
  top: Schema.Boolean,
  bottom: Schema.Boolean,
  left: Schema.Boolean,
  right: Schema.Boolean
})

export type Edges = typeof Edges.Type

export const Model = Schema.Struct({
  id: Schema.String,
  metrics: Schema.Option(Metrics),
  shown: Schema.Boolean,
  generation: Schema.Int,
  drag: Schema.Option(Drag),
  edges: Edges,
  overflowing: Schema.Option(Schema.Boolean),
  scrollbarHovered: Schema.Boolean
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  metrics: Option.none(),
  shown: false,
  generation: 0,
  drag: Option.none(),
  edges: { top: true, bottom: false, left: true, right: false },
  overflowing: Option.none(),
  scrollbarHovered: false
})

export const Message = defineMessageUnion({
  Measured: { metrics: Metrics },
  Scrolled: { metrics: Metrics },
  EnteredRoot: {},
  LeftRoot: {},
  HideElapsed: { generation: Schema.Int },
  PressedScrollbar: { axis: Axis, pointer: Schema.Finite, offset: Schema.Finite, track: Track },
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedPointer: {},
  Wheeled: { axis: Axis, delta: Schema.Finite },
  CompletedScroll: {},
  HoveredScrollbar: { hovered: Schema.Boolean }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ScrollPositionChanged: { x: Schema.Finite, y: Schema.Finite },
  TopReached: {},
  BottomReached: {},
  LeftReached: {},
  RightReached: {},
  OverflowChanged: { overflowing: Schema.Boolean }
})

export type OutMessage = typeof OutMessage.Type

export type ScrollAreaType = "auto" | "always" | "scroll" | "hover" | "never"

export type ScrollAreaContext = { readonly type?: ScrollAreaType; readonly scrollHideDelay?: number }

type Effects =
  | { readonly _tag: "None" }
  | { readonly _tag: "ScrollTo"; readonly axis: Axis; readonly position: number }
  | { readonly _tag: "HideAfterDelay"; readonly generation: number }

type Step = {
  readonly model: Model
  readonly effect: Effects
  readonly outMessages: ReadonlyArray<OutMessage>
}

const none: Effects = { _tag: "None" }

const scrollEffect = (axis: Axis, position: number): Effects => ({ _tag: "ScrollTo", axis, position })

export type Sizes = { readonly content: number; readonly viewport: number; readonly track: Track }

const linearScale =
  (input: readonly [number, number], output: readonly [number, number]) =>
  (value: number): number => {
    if (input[0] === input[1]) return output[0]
    if (output[0] === output[1]) return output[0]

    return output[0] + ((output[1] - output[0]) / (input[1] - input[0])) * (value - input[0])
  }

export const thumbRatio = (viewport: number, content: number): number => {
  const ratio = viewport / content

  return Number.isNaN(ratio) ? 0 : ratio
}

export const thumbSize = (sizes: Sizes): number =>
  Math.max(
    (sizes.track.size - sizes.track.paddingStart - sizes.track.paddingEnd) * thumbRatio(sizes.viewport, sizes.content),
    18
  )

export const scrollFromPointer = (pointer: number, offset: number, sizes: Sizes): number => {
  const size = thumbSize(sizes)
  const grip = offset === 0 ? size / 2 : offset
  const low = sizes.track.paddingStart + grip
  const high = sizes.track.size - sizes.track.paddingEnd - (size - grip)

  return linearScale([low, high], [0, sizes.content - sizes.viewport])(pointer)
}

export const overflowsX = (metrics: Metrics): boolean => metrics.scrollWidth > metrics.clientWidth

export const overflowsY = (metrics: Metrics): boolean => metrics.scrollHeight > metrics.clientHeight

export const progressOf = (metrics: Metrics, axis: Axis): number => {
  const range = axis === "y" ? metrics.scrollHeight - metrics.clientHeight : metrics.scrollWidth - metrics.clientWidth
  const position = axis === "y" ? metrics.scrollTop : metrics.scrollLeft

  return range <= 0 ? 0 : Math.min(Math.max(position / range, 0), 1)
}

export const edgesOf = (metrics: Metrics): Edges => ({
  top: metrics.scrollTop === 0,
  bottom: metrics.scrollTop - (metrics.scrollHeight - metrics.clientHeight) >= -0.8,
  left: metrics.scrollLeft === 0,
  right: metrics.scrollLeft - (metrics.scrollWidth - metrics.clientWidth) >= -0.8
})

const reached = (before: Edges, after: Edges): ReadonlyArray<OutMessage> => [
  ...(after.bottom && !before.bottom ? [OutMessage.BottomReached()] : []),
  ...(after.top && !before.top ? [OutMessage.TopReached()] : []),
  ...(after.right && !before.right ? [OutMessage.RightReached()] : []),
  ...(after.left && !before.left ? [OutMessage.LeftReached()] : [])
]

const overflowChange = (model: Model, metrics: Metrics): ReadonlyArray<OutMessage> => {
  const overflowing = overflowsY(metrics)
  if (Option.isNone(model.overflowing)) return []

  return model.overflowing.value === overflowing ? [] : [OutMessage.OverflowChanged({ overflowing })]
}

const hideLater = (model: Model): Step => {
  const generation = model.generation + 1

  const effect: Effects = { _tag: "HideAfterDelay", generation }

  return { model: { ...model, generation }, effect, outMessages: [] }
}

const unchanged = (model: Model): Step => ({ model, effect: none, outMessages: [] })

const sizesOf = (metrics: Metrics, drag: Drag): Sizes =>
  drag.axis === "y"
    ? { content: metrics.scrollHeight, viewport: metrics.clientHeight, track: drag.track }
    : { content: metrics.scrollWidth, viewport: metrics.clientWidth, track: drag.track }

const dragTo = (model: Model, drag: Drag, pointer: number): Step =>
  Option.match(model.metrics, {
    onNone: () => unchanged(model),
    onSome: (metrics) => ({
      model,
      effect: scrollEffect(
        drag.axis,
        scrollFromPointer(pointer - drag.track.start, drag.offset, sizesOf(metrics, drag))
      ),
      outMessages: []
    })
  })

const scrolled = (model: Model, metrics: Metrics, context: ScrollAreaContext): Step => {
  const edges = edgesOf(metrics)
  const next = { ...model, metrics: Option.some(metrics), edges, overflowing: Option.some(overflowsY(metrics)) }
  const outMessages = [
    OutMessage.ScrollPositionChanged({ x: metrics.scrollLeft, y: metrics.scrollTop }),
    ...reached(model.edges, edges)
  ]
  if (context.type !== "scroll") return { model: next, effect: none, outMessages }
  const hiding = hideLater({ ...next, shown: true })

  return { ...hiding, outMessages }
}

const handle = (model: Model, message: Message, context: ScrollAreaContext): Step =>
  Message.match<Step>(message, {
    Measured: ({ metrics }) => ({
      model: { ...model, metrics: Option.some(metrics), overflowing: Option.some(overflowsY(metrics)) },
      effect: none,
      outMessages: overflowChange(model, metrics)
    }),
    Scrolled: ({ metrics }) => scrolled(model, metrics, context),
    HoveredScrollbar: ({ hovered }) => unchanged({ ...model, scrollbarHovered: hovered }),
    EnteredRoot: () => ({
      model: { ...model, shown: true, generation: model.generation + 1 },
      effect: none,
      outMessages: []
    }),
    LeftRoot: () => (context.type === "hover" || context.type === undefined ? hideLater(model) : unchanged(model)),
    HideElapsed: ({ generation }) =>
      generation === model.generation ? unchanged({ ...model, shown: false }) : unchanged(model),
    PressedScrollbar: ({ axis, pointer, offset, track }) => {
      const drag = { axis, offset, track }

      return dragTo({ ...model, drag: Option.some(drag) }, drag, pointer)
    },
    MovedPointer: ({ x, y }) =>
      Option.match(model.drag, {
        onNone: () => unchanged(model),
        onSome: (drag) => dragTo(model, drag, drag.axis === "y" ? y : x)
      }),
    ReleasedPointer: () => unchanged({ ...model, drag: Option.none() }),
    Wheeled: ({ axis, delta }) =>
      Option.match(model.metrics, {
        onNone: () => unchanged(model),
        onSome: (metrics) => ({
          model,
          effect: scrollEffect(axis, (axis === "y" ? metrics.scrollTop : metrics.scrollLeft) + delta),
          outMessages: []
        })
      }),
    CompletedScroll: () => unchanged(model)
  })

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const viewportId = (model: Model): string => `${model.id}-viewport`

const commandsOf = (
  model: Model,
  effect: Effects,
  context: ScrollAreaContext
): ReadonlyArray<Command.Command<Message>> => {
  if (effect._tag === "ScrollTo") {
    return [
      Command.mapMessage(ScrollViewport({ id: viewportId(model), axis: effect.axis, position: effect.position }), () =>
        Message.CompletedScroll()
      )
    ]
  }
  if (effect._tag === "HideAfterDelay") {
    return [
      Command.mapMessage(HideAfterDelay({ delay: context.scrollHideDelay ?? 1000 }), () =>
        Message.HideElapsed({ generation: effect.generation })
      )
    ]
  }

  return []
}

export const update = (model: Model, message: Message, context: ScrollAreaContext = {}): Result => {
  const result = handle(model, message, context)

  return { model: result.model, commands: commandsOf(model, result.effect, context), outMessages: result.outMessages }
}
