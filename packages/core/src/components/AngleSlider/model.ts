import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

const Point = Schema.Struct({ x: Schema.Finite, y: Schema.Finite })

export type Point = typeof Point.Type

export const Model = Schema.Struct({ id: Schema.String, dragging: Schema.Boolean, center: Point })

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  dragging: false,
  center: { x: 0, y: 0 }
})

export const Message = defineMessageUnion({
  Pressed: { x: Schema.Finite, y: Schema.Finite, center: Point },
  Moved: { x: Schema.Finite, y: Schema.Finite },
  Released: {},
  PressedKey: { key: Schema.String }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.Finite },
  ChangeEnded: { value: Schema.Finite },
  ScrubStarted: {},
  ScrubEnded: {}
})

export type OutMessage = typeof OutMessage.Type

export type AngleSliderContext = {
  readonly value: number
  readonly step?: number
  readonly marks?: ReadonlyArray<number>
  readonly restrictToMarks?: boolean
  readonly disabled?: boolean
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

export const angleAt = (point: Point, center: Point): number =>
  360 - (Math.atan2(point.x - center.x, point.y - center.y) * (180 / Math.PI) + 180)

const digitsAfterDot = (value: number): number => value.toString().split(".")[1]?.length ?? 0

export const normalizeRadialValue = (degree: number, step: number): number => {
  const clamped = Math.min(360, Math.max(0, degree))
  const chosen = Math.ceil(clamped / step) * step

  return Number.parseFloat((chosen === 360 ? 0 : chosen).toFixed(digitsAfterDot(step)))
}

export const findClosestNumber = (value: number, numbers: ReadonlyArray<number>): number =>
  numbers.reduce(
    (closest, current) => (Math.abs(current - value) < Math.abs(closest - value) ? current : closest),
    numbers[0] ?? value
  )

const restricted = (value: number, context: AngleSliderContext): number =>
  context.restrictToMarks === true && context.marks !== undefined && context.marks.length > 0
    ? findClosestNumber(value, context.marks)
    : value

const backKeys: ReadonlySet<string> = new Set(["ArrowLeft", "ArrowDown"])

const forwardKeys: ReadonlySet<string> = new Set(["ArrowRight", "ArrowUp"])

export const handledKeys: ReadonlySet<string> = new Set([...backKeys, ...forwardKeys, "Home", "End"])

const stepped = (value: number, key: string, step: number): number => {
  if (key === "Home") return 0
  if (key === "End") return 359
  if (backKeys.has(key)) return value === 0 ? 359 : normalizeRadialValue(value - step, step)
  if (forwardKeys.has(key)) return value === 359 ? 0 : normalizeRadialValue(value + step, step)

  return value
}

const nextMark = (marks: ReadonlyArray<number>, index: number, key: string): number | undefined => {
  if (backKeys.has(key)) return marks[index === 0 ? marks.length - 1 : index - 1]
  if (forwardKeys.has(key)) return marks[index === marks.length - 1 ? 0 : index + 1]

  return undefined
}

export const keyValue = (key: string, context: AngleSliderContext): number => {
  const next = stepped(context.value, key, context.step ?? 1)
  if (context.restrictToMarks !== true || context.marks === undefined) return next
  const index = context.marks.indexOf(context.value)

  return (index === -1 ? undefined : nextMark(context.marks, index, key)) ?? findClosestNumber(next, context.marks)
}

const valueAt = (point: Point, center: Point, context: AngleSliderContext): number =>
  restricted(normalizeRadialValue(angleAt(point, center), context.step ?? 1), context)

export const update = (model: Model, message: Message, context: AngleSliderContext): Result => {
  if (context.disabled === true) return { model, outMessages: [] }

  return Message.match(message, {
    Pressed: ({ x, y, center }) => ({
      model: { ...model, dragging: true, center },
      outMessages: [OutMessage.Changed({ value: valueAt({ x, y }, center, context) }), OutMessage.ScrubStarted()]
    }),
    Moved: ({ x, y }) => ({
      model,
      outMessages: model.dragging ? [OutMessage.Changed({ value: valueAt({ x, y }, model.center, context) })] : []
    }),
    Released: () =>
      model.dragging
        ? {
            model: { ...model, dragging: false },
            outMessages: [OutMessage.ChangeEnded({ value: context.value }), OutMessage.ScrubEnded()]
          }
        : { model, outMessages: [] },
    PressedKey: ({ key }) => {
      const value = keyValue(key, context)

      return { model, outMessages: [OutMessage.Changed({ value }), OutMessage.ChangeEnded({ value })] }
    }
  })
}
