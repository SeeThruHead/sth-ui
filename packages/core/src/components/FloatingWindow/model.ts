import { Option, Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

const Point = Schema.Struct({ x: Schema.Finite, y: Schema.Finite })

const Size = Schema.Struct({ width: Schema.Finite, height: Schema.Finite })

export const Gesture = Schema.Struct({
  kind: Schema.Literals(["drag", "resize"]),
  startX: Schema.Finite,
  startY: Schema.Finite,
  left: Schema.Finite,
  top: Schema.Finite,
  width: Schema.Finite,
  height: Schema.Finite,
  viewportWidth: Schema.Finite,
  viewportHeight: Schema.Finite
})

export type Gesture = typeof Gesture.Type

export const Model = Schema.Struct({
  id: Schema.String,
  position: Schema.Option(Point),
  size: Schema.Option(Size),
  gesture: Schema.Option(Gesture)
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  position: Option.none(),
  size: Option.none(),
  gesture: Option.none()
})

export const Message = defineMessageUnion({
  Placed: { x: Schema.Finite, y: Schema.Finite },
  Positioned: { x: Schema.Finite, y: Schema.Finite },
  Unplaced: {},
  Pressed: { gesture: Gesture },
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedPointer: {},
  PressedResizeKey: { key: Schema.String }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  PositionChanged: { x: Schema.Finite, y: Schema.Finite },
  DragStarted: {},
  DragEnded: {},
  SizeChanged: { width: Schema.Finite, height: Schema.Finite },
  ResizeStarted: {},
  ResizeEnded: {}
})

export type OutMessage = typeof OutMessage.Type

export type FloatingWindowPosition = {
  readonly top?: number | undefined
  readonly left?: number | undefined
  readonly right?: number | undefined
  readonly bottom?: number | undefined
}

export type FloatingWindowDimensions = {
  readonly initialWidth?: number
  readonly initialHeight?: number
  readonly minWidth?: number
  readonly maxWidth?: number
  readonly minHeight?: number
  readonly maxHeight?: number
}

export type FloatingWindowRules = {
  readonly axis?: "x" | "y"
  readonly constrainToViewport?: boolean
  readonly constrainOffset?: number
  readonly dimensions?: FloatingWindowDimensions
}

type Update = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const clamp = (value: number, min: number | undefined, max: number | undefined) =>
  Math.min(Math.max(value, min ?? Number.NEGATIVE_INFINITY), max ?? Number.POSITIVE_INFINITY)

const inViewport = (rules: FloatingWindowRules, gesture: Gesture, x: number, y: number) => {
  if (rules.constrainToViewport === false) return { x, y }
  const offset = rules.constrainOffset ?? 0

  return {
    x: clamp(x, offset, gesture.viewportWidth - gesture.width - offset),
    y: clamp(y, offset, gesture.viewportHeight - gesture.height - offset)
  }
}

const dragged = (rules: FloatingWindowRules, gesture: Gesture, x: number, y: number) =>
  inViewport(
    rules,
    gesture,
    rules.axis === "y" ? gesture.left : gesture.left + x - gesture.startX,
    rules.axis === "x" ? gesture.top : gesture.top + y - gesture.startY
  )

const viewportLimit = (rules: FloatingWindowRules, available: number) =>
  rules.constrainToViewport === false ? undefined : available - (rules.constrainOffset ?? 0)

const resized = (rules: FloatingWindowRules, gesture: Gesture, width: number, height: number) => {
  const dimensions = rules.dimensions ?? {}

  return {
    width: clamp(
      width,
      dimensions.minWidth,
      Math.min(
        dimensions.maxWidth ?? Number.POSITIVE_INFINITY,
        viewportLimit(rules, gesture.viewportWidth - gesture.left) ?? Number.POSITIVE_INFINITY
      )
    ),
    height: clamp(
      height,
      dimensions.minHeight,
      Math.min(
        dimensions.maxHeight ?? Number.POSITIVE_INFINITY,
        viewportLimit(rules, gesture.viewportHeight - gesture.top) ?? Number.POSITIVE_INFINITY
      )
    )
  }
}

export const keySteps: { readonly [Key in string]?: readonly [number, number] } = {
  ArrowRight: [10, 0],
  ArrowLeft: [-10, 0],
  ArrowDown: [0, 10],
  ArrowUp: [0, -10]
}

const placedAt = (model: Model, x: number, y: number): Update => ({
  model: { ...model, position: Option.some({ x, y }) },
  commands: [],
  outMessages: [OutMessage.PositionChanged({ x, y })]
})

const fromPointer = (model: Model, rules: FloatingWindowRules, x: number, y: number): Update =>
  Option.match(model.gesture, {
    onNone: () => ({ model, commands: [], outMessages: [] }),
    onSome: (gesture) => {
      if (gesture.kind === "drag") {
        const next = dragged(rules, gesture, x, y)

        return placedAt(model, next.x, next.y)
      }
      const size = resized(rules, gesture, gesture.width + x - gesture.startX, gesture.height + y - gesture.startY)

      return {
        model: { ...model, size: Option.some(size) },
        commands: [],
        outMessages: [OutMessage.SizeChanged(size)]
      }
    }
  })

const ended = (model: Model): Update => ({
  model: { ...model, gesture: Option.none() },
  commands: [],
  outMessages: Option.match(model.gesture, {
    onNone: () => [],
    onSome: (gesture) => [gesture.kind === "drag" ? OutMessage.DragEnded() : OutMessage.ResizeEnded()]
  })
})

const keyed = (model: Model, rules: FloatingWindowRules, key: string): Update => {
  const step = keySteps[key]
  const dimensions = rules.dimensions ?? {}
  const current = Option.getOrElse(model.size, () => ({
    width: dimensions.initialWidth ?? 0,
    height: dimensions.initialHeight ?? 0
  }))
  if (step === undefined) return { model, commands: [], outMessages: [] }
  const size = {
    width: clamp(current.width + step[0], dimensions.minWidth, dimensions.maxWidth),
    height: clamp(current.height + step[1], dimensions.minHeight, dimensions.maxHeight)
  }

  return { model: { ...model, size: Option.some(size) }, commands: [], outMessages: [OutMessage.SizeChanged(size)] }
}

export const update = (model: Model, message: Message, rules: FloatingWindowRules = {}): Update =>
  Message.match(message, {
    Placed: ({ x, y }) =>
      Option.isSome(model.position) ? { model, commands: [], outMessages: [] } : placedAt(model, x, y),
    Positioned: ({ x, y }) => placedAt(model, x, y),
    Unplaced: () => ({ model, commands: [], outMessages: [] }),
    Pressed: ({ gesture }) => ({
      model: { ...model, gesture: Option.some(gesture) },
      commands: [],
      outMessages: [gesture.kind === "drag" ? OutMessage.DragStarted() : OutMessage.ResizeStarted()]
    }),
    MovedPointer: ({ x, y }) => fromPointer(model, rules, x, y),
    ReleasedPointer: () => ended(model),
    PressedResizeKey: ({ key }) => keyed(model, rules, key)
  })

export type Box = { readonly left: number; readonly top: number; readonly width: number; readonly height: number }

export type Viewport = { readonly width: number; readonly height: number }

export const placementOf = (
  box: Box,
  viewport: Viewport,
  config: FloatingWindowPosition,
  rules: FloatingWindowRules
) => {
  const x = config.left ?? (config.right === undefined ? box.left : viewport.width - box.width - config.right)
  const y = config.top ?? (config.bottom === undefined ? box.top : viewport.height - box.height - config.bottom)
  const gesture = {
    kind: "drag" as const,
    startX: 0,
    startY: 0,
    left: 0,
    top: 0,
    width: box.width,
    height: box.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height
  }

  return inViewport(rules, gesture, x, y)
}
