import * as FoldkitSlider from "@foldkit/ui/slider"
import { Array as Arr, Option, Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const SliderOutMessage = defineMessageUnion({
  ChangedValue: { value: Schema.Finite },
  ChangeEnded: { value: Schema.Finite }
})

export type SliderOutMessage = typeof SliderOutMessage.Type

export type SliderContext = {
  readonly value: number
  readonly domain?: readonly [number, number]
  readonly precision?: number
  readonly marks?: ReadonlyArray<{ readonly value: number }>
  readonly restrictToMarks?: boolean
}

export type SliderResult = {
  readonly model: FoldkitSlider.Model
  readonly commands: ReadonlyArray<Command.Command<FoldkitSlider.Message>>
  readonly outMessages: ReadonlyArray<SliderOutMessage>
}

const rounded = (value: number, precision: number | undefined): number =>
  precision === undefined ? value : Number(value.toFixed(precision))

const clamped = (value: number, domain: readonly [number, number] | undefined): number =>
  domain === undefined ? value : Math.min(Math.max(value, domain[0]), domain[1])

const nearestMark = (marks: ReadonlyArray<number>, value: number): number =>
  marks.reduce((best, mark) => (Math.abs(mark - value) < Math.abs(best - value) ? mark : best))

const nextMark = (marks: ReadonlyArray<number>, previous: number, next: number): number => {
  const sorted = marks.toSorted((a, b) => a - b)
  const beyond =
    next > previous ? Arr.findFirst(sorted, (mark) => mark > previous) : Arr.findLast(sorted, (mark) => mark < previous)

  return Option.getOrElse(beyond, () => previous)
}

const toMarks = (context: SliderContext, next: number, keyboard: boolean): number => {
  const marks = (context.marks ?? []).map((mark) => mark.value)
  if (context.restrictToMarks !== true || marks.length === 0) return next

  return keyboard ? nextMark(marks, context.value, next) : nearestMark(marks, next)
}

export const restrictedValue = (context: SliderContext, next: number, keyboard: boolean): number => {
  return rounded(clamped(toMarks(context, next, keyboard), context.domain), context.precision)
}

const endsChange = (message: FoldkitSlider.Message): boolean =>
  message._tag === "ReleasedDragPointer" || message._tag === "PressedKeyboardNavigation"

export const updateWith = (
  model: FoldkitSlider.Model,
  message: FoldkitSlider.Message,
  context: SliderContext
): SliderResult => {
  const result = FoldkitSlider.update(model, message)
  const keyboard = message._tag === "PressedKeyboardNavigation"
  const changed = Option.map(Option.fromNullishOr(result.outMessage), (out) =>
    restrictedValue(context, out.value, keyboard)
  )
  const value = Option.getOrElse(changed, () => context.value)

  return {
    model: result.model,
    commands: result.commands ?? [],
    outMessages: [
      ...Option.toArray(Option.map(changed, (next) => SliderOutMessage.ChangedValue({ value: next }))),
      ...(endsChange(message) ? [SliderOutMessage.ChangeEnded({ value })] : [])
    ]
  }
}
