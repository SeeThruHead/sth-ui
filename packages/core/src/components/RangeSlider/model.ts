import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { FocusThumb } from "./focus.ts"

export type RangeValue = readonly [number, number]

export const RangeValue = Schema.Tuple([Schema.Finite, Schema.Finite])

export const Box = Schema.Struct({
  left: Schema.Finite,
  top: Schema.Finite,
  width: Schema.Finite,
  height: Schema.Finite
})

export type Box = typeof Box.Type

export const Drag = Schema.Struct({ thumb: Schema.Int, box: Box })

export const Model = Schema.Struct({
  id: Schema.String,
  min: Schema.Finite,
  max: Schema.Finite,
  step: Schema.Finite,
  drag: Schema.Option(Drag)
})

export type Model = typeof Model.Type

export type InitConfig = {
  readonly id: string
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

export const init = (config: InitConfig): Model => ({
  id: config.id,
  min: config.min ?? 0,
  max: config.max ?? 100,
  step: config.step ?? 1,
  drag: Option.none()
})

export const Message = defineMessageUnion({
  PressedTrack: { x: Schema.Finite, y: Schema.Finite, box: Box, thumb: Schema.NullOr(Schema.Int) },
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  ReleasedPointer: {},
  PressedKey: { thumb: Schema.Int, key: Schema.String },
  CompletedFocus: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: RangeValue },
  ChangeEnded: { value: RangeValue }
})

export type OutMessage = typeof OutMessage.Type

export type RangeRules = {
  readonly minRange?: number
  readonly maxRange?: number
  readonly pushOnOverlap?: boolean
  readonly marks?: ReadonlyArray<number>
  readonly restrictToMarks?: boolean
  readonly domain?: RangeValue
  readonly vertical?: boolean
  readonly disabled?: boolean
}

export type RangeContext = RangeRules & { readonly value: RangeValue }

type Bounds = { readonly min: number; readonly max: number; readonly step: number }

const epsilon = 0.000000001

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const precisionOf = (step: number): number => {
  const fraction = String(step).split(".")[1]

  return fraction === undefined ? 0 : fraction.length
}

const floating = (value: number, precision: number) => Number.parseFloat(value.toFixed(precision))

export const positionOf = (value: number, min: number, max: number): number =>
  clamp(((value - min) * 100) / (max - min), 0, 100)

export const changeValue = (fraction: number, bounds: Bounds, precision: number): number => {
  const dx = clamp(fraction, 0, 1) * (bounds.max - bounds.min)
  const next = (dx === 0 ? 0 : Math.round(dx / bounds.step) * bounds.step) + bounds.min

  return Number(Math.max(next, bounds.min).toFixed(precision))
}

export const nearestThumb = (value: RangeValue, target: number): 0 | 1 =>
  Math.abs(value[0] - target) > Math.abs(value[1] - target) ? 1 : 0

const sorted = (marks: ReadonlyArray<number>) => marks.toSorted((a, b) => a - b)

export const nextMark = (value: number, marks: ReadonlyArray<number>): number =>
  sorted(marks).find((mark) => mark > value) ?? value

export const previousMark = (value: number, marks: ReadonlyArray<number>): number =>
  sorted(marks)
    .toReversed()
    .find((mark) => mark < value) ?? value

const closestMark = (value: number, marks: ReadonlyArray<number>) =>
  marks.reduce((best, mark) => (Math.abs(mark - value) < Math.abs(best - value) ? mark : best))

const withThumb = (value: RangeValue, thumb: 0 | 1, next: number): RangeValue =>
  thumb === 0 ? [next, value[1]] : [value[0], next]

const onMarks = (current: RangeValue, raw: number, thumb: 0 | 1, marks: ReadonlyArray<number>): RangeValue => {
  const closest = closestMark(raw, marks)
  const other = thumb === 0 ? 1 : 0
  const ordered = sorted(marks)
  const atEnds = (end: number | undefined) => closest === end && current[other] === end
  if (atEnds(ordered.at(-1)) || atEnds(ordered[0])) return current
  const moved = withThumb(current, thumb, closest)
  if (closest !== current[other]) return moved
  const pushed = current[thumb] > current[other] ? previousMark(closest, marks) : nextMark(closest, marks)

  return withThumb(moved, other, pushed)
}

type Limits = Bounds & { readonly minRange: number; readonly maxRange: number; readonly push: boolean }

const fromThumb = (current: RangeValue, raw: number, limits: Limits): RangeValue => {
  const value = clamp(raw, limits.min, limits.max)
  const crowded = value > current[1] - (limits.minRange - epsilon)
  const pushed: RangeValue = crowded
    ? limits.push
      ? [value, Math.min(raw + limits.minRange, limits.max)]
      : current
    : [value, current[1]]
  const ceiling = limits.max - (limits.minRange - epsilon)
  const capped: RangeValue = value > ceiling ? [current[0], pushed[1]] : pushed
  if (capped[1] - raw <= limits.maxRange) return capped

  return limits.push ? [capped[0], raw + limits.maxRange] : [current[0], capped[1]]
}

const toThumb = (current: RangeValue, raw: number, limits: Limits): RangeValue => {
  const value = clamp(raw, limits.min, limits.max)
  const crowded = value < current[0] + limits.minRange
  const pushed: RangeValue = crowded
    ? limits.push
      ? [Math.max(raw - limits.minRange, limits.min), value]
      : current
    : [current[0], value]
  const floored: RangeValue = value < pushed[0] + limits.minRange ? [pushed[0], current[1]] : pushed
  if (value - floored[0] <= limits.maxRange) return floored

  return limits.push ? [raw - limits.maxRange, floored[1]] : [floored[0], current[1]]
}

export const rangedValue = (
  current: RangeValue,
  raw: number,
  thumb: 0 | 1,
  bounds: Bounds,
  rules: RangeRules
): RangeValue => {
  const precision = precisionOf(bounds.step)
  const limits: Limits = {
    ...bounds,
    minRange: rules.minRange ?? 10,
    maxRange: rules.maxRange ?? Number.POSITIVE_INFINITY,
    push: rules.pushOnOverlap !== false
  }
  const marks = rules.marks ?? []
  const next =
    rules.restrictToMarks === true && marks.length > 0
      ? onMarks(current, raw, thumb, marks)
      : (thumb === 0 ? fromThumb : toThumb)(current, raw, limits)
  const first = floating(next[0], precision)
  const second = floating(next[1], precision)

  return first > second ? [second, first] : [first, second]
}

const keySteps: Readonly<Record<string, 1 | -1>> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }

export const keyValue = (
  key: string,
  current: RangeValue,
  thumb: 0 | 1,
  bounds: Bounds,
  rules: RangeRules
): Option.Option<RangeValue> =>
  Option.map(Option.fromNullishOr(keySteps[key]), (direction) => {
    const [low, high] = rules.domain ?? [bounds.min, bounds.max]
    const value = current[thumb]
    const marks = rules.marks ?? []
    const raw =
      rules.restrictToMarks === true && marks.length > 0
        ? (direction === 1 ? nextMark : previousMark)(value, marks)
        : clamp(value + direction * bounds.step, low, high)

    return rangedValue(current, floating(raw, precisionOf(bounds.step)), thumb, bounds, rules)
  })

const fractionAt = (box: Box, x: number, y: number, vertical: boolean) =>
  vertical ? (box.top + box.height - y) / box.height : (x - box.left) / box.width

export const thumbId = (model: Model, thumb: number): string => `${model.id}-thumb-${thumb}`

type Step = {
  readonly model: Model
  readonly focus: Option.Option<number>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const valueAt = (model: Model, context: RangeContext, x: number, y: number, box: Box) => {
  const [min, max] = context.domain ?? [model.min, model.max]

  return changeValue(
    fractionAt(box, x, y, context.vertical === true),
    { min, max, step: model.step },
    precisionOf(model.step)
  )
}

const unchanged = (model: Model): Step => ({ model, focus: Option.none(), outMessages: [] })

const handle = (model: Model, message: Message, context: RangeContext): Step =>
  Message.match(message, {
    PressedTrack: ({ x, y, box, thumb }) => {
      if (context.disabled === true) return unchanged(model)
      const raw = valueAt(model, context, x, y, box)
      const index = thumb === 1 ? 1 : thumb === 0 ? 0 : nearestThumb(context.value, raw)
      const value = rangedValue(context.value, raw, index, model, context)

      return {
        model: { ...model, drag: Option.some({ thumb: index, box }) },
        focus: Option.some(index),
        outMessages: [OutMessage.Changed({ value })]
      }
    },
    MovedPointer: ({ x, y }) =>
      Option.match(model.drag, {
        onNone: () => unchanged(model),
        onSome: (drag) => ({
          model,
          focus: Option.none(),
          outMessages: [
            OutMessage.Changed({
              value: rangedValue(
                context.value,
                valueAt(model, context, x, y, drag.box),
                drag.thumb === 1 ? 1 : 0,
                model,
                context
              )
            })
          ]
        })
      }),
    ReleasedPointer: () =>
      Option.isNone(model.drag)
        ? unchanged(model)
        : {
            model: { ...model, drag: Option.none() },
            focus: Option.none(),
            outMessages: [OutMessage.ChangeEnded({ value: context.value })]
          },
    PressedKey: ({ thumb, key }) =>
      Option.match(
        context.disabled === true ? Option.none() : keyValue(key, context.value, thumb === 1 ? 1 : 0, model, context),
        {
          onNone: () => unchanged(model),
          onSome: (value) => ({
            model,
            focus: Option.none(),
            outMessages: [OutMessage.Changed({ value }), OutMessage.ChangeEnded({ value })]
          })
        }
      ),
    CompletedFocus: () => unchanged(model)
  })

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const update = (model: Model, message: Message, context: RangeContext): Result => {
  const result = handle(model, message, context)

  return {
    model: result.model,
    commands: Option.match(result.focus, {
      onNone: () => [],
      onSome: (thumb) => [Command.mapMessage(FocusThumb({ id: thumbId(model, thumb) }), () => Message.CompletedFocus())]
    }),
    outMessages: result.outMessages
  }
}
