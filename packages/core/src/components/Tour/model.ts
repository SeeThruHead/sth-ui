import { Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"

export const TourMode = Schema.Literals(["guided", "beacon"])

export type TourMode = typeof TourMode.Type

export const Model = Schema.Struct({
  id: Schema.String,
  active: Schema.Boolean,
  step: Schema.Int,
  defaultStep: Schema.Int,
  beaconStep: Schema.NullOr(Schema.Int)
})

export type Model = typeof Model.Type

export const init = (config: {
  readonly id: string
  readonly defaultStep?: number
  readonly active?: boolean
}): Model => ({
  id: config.id,
  active: config.active === true,
  step: config.defaultStep ?? 0,
  defaultStep: config.defaultStep ?? 0,
  beaconStep: null
})

export const Message = defineMessageUnion({
  Started: {},
  StartedAt: { step: Schema.Int },
  Closed: {},
  Ended: {},
  SetStep: { step: Schema.Int },
  OpenedBeacon: { step: Schema.Int },
  PressedKey: { key: Schema.String, insideTarget: Schema.Boolean },
  CompletedMount: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  StepChanged: { step: Schema.Int },
  StepOpened: { step: Schema.Int },
  StepClosed: { step: Schema.Int },
  Closed: {}
})

export type OutMessage = typeof OutMessage.Type

export type TourContext = {
  readonly stepsCount: number
  readonly mode?: TourMode
  readonly closeOnEscape?: boolean
  readonly withKeyboardNavigation?: boolean
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

const modeOf = (context: TourContext): TourMode => context.mode ?? "guided"

export const showsTooltip = (model: Model, context: TourContext): boolean =>
  model.active && (modeOf(context) === "guided" || model.beaconStep !== null)

export const displayStep = (model: Model, context: TourContext): number =>
  modeOf(context) === "beacon" && model.beaconStep !== null ? model.beaconStep : model.step

const openStep = (model: Model, context: TourContext): number | null =>
  showsTooltip(model, context) ? displayStep(model, context) : null

const transitions = (before: Model, after: Model, context: TourContext): ReadonlyArray<OutMessage> => {
  const was = openStep(before, context)
  const now = openStep(after, context)
  if (was === now) return []

  return [
    ...(was === null ? [] : [OutMessage.StepClosed({ step: was })]),
    ...(now === null ? [] : [OutMessage.StepOpened({ step: now })])
  ]
}

const moved = (before: Model, after: Model, context: TourContext): Result => ({
  model: after,
  outMessages: [
    ...(before.step === after.step ? [] : [OutMessage.StepChanged({ step: after.step })]),
    ...transitions(before, after, context)
  ]
})

const end = (model: Model, context: TourContext): Result => {
  const closed = moved(model, { ...model, active: false, beaconStep: null, step: model.defaultStep }, context)

  return { ...closed, outMessages: [...closed.outMessages, OutMessage.Closed()] }
}

const close = (model: Model, context: TourContext): Result => {
  if (modeOf(context) === "guided") return end(model, context)
  const closed = moved(model, { ...model, beaconStep: null }, context)

  return { ...closed, outMessages: [...closed.outMessages, OutMessage.Closed()] }
}

const setStep = (model: Model, step: number, context: TourContext): Result =>
  moved(
    model,
    {
      ...model,
      step,
      beaconStep: modeOf(context) === "beacon" && model.beaconStep !== null ? step : model.beaconStep
    },
    context
  )

const navigates = (model: Model, insideTarget: boolean, context: TourContext): boolean =>
  model.active && modeOf(context) === "guided" && context.withKeyboardNavigation !== false && !insideTarget

const pressedKey = (model: Model, key: string, insideTarget: boolean, context: TourContext): Result => {
  if (key === "Escape" && showsTooltip(model, context) && context.closeOnEscape !== false) {
    return close(model, context)
  }
  if (!navigates(model, insideTarget, context)) return { model, outMessages: [] }
  if (key === "ArrowRight") {
    return model.step < context.stepsCount - 1 ? setStep(model, model.step + 1, context) : close(model, context)
  }
  if (key === "ArrowLeft" && model.step > 0) return setStep(model, model.step - 1, context)

  return { model, outMessages: [] }
}

export const update = (model: Model, message: Message, context: TourContext): Result =>
  Message.match(message, {
    Started: () => moved(model, { ...model, active: true }, context),
    StartedAt: ({ step }) => moved(model, { ...model, active: true, step }, context),
    Closed: () => close(model, context),
    Ended: () => end(model, context),
    SetStep: ({ step }) => setStep(model, step, context),
    OpenedBeacon: ({ step }) => moved(model, { ...model, beaconStep: step, step }, context),
    PressedKey: ({ key, insideTarget }) => pressedKey(model, key, insideTarget, context),
    CompletedMount: () => ({ model, outMessages: [] })
  })

export type Rect = { readonly top: number; readonly left: number; readonly width: number; readonly height: number }

export const spotlightRect = (target: Rect, padding: number): Rect => ({
  left: target.left - padding,
  top: target.top - padding,
  width: target.width + padding * 2,
  height: target.height + padding * 2
})

const overlayExtent = 100000

const outerPath = `M${-overlayExtent} ${-overlayExtent}H${overlayExtent}V${overlayExtent}H${-overlayExtent}Z`

export const overlayHitPath = (target: Rect | null, padding: number, radius: number): string => {
  if (target === null) return outerPath
  const { left: x, top: y, width: w, height: h } = spotlightRect(target, padding)
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))

  return (
    `${outerPath}M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  )
}

export const rectWithin = (inner: Rect, outer: Rect): boolean => {
  if (inner.top < outer.top) return false
  if (inner.left < outer.left) return false
  if (inner.top + inner.height > outer.top + outer.height) return false

  return inner.left + inner.width <= outer.left + outer.width
}

export const isInView = (target: Rect, viewport: Rect, clips: ReadonlyArray<Rect>): boolean => {
  if (target.width === 0 && target.height === 0) return false

  return rectWithin(target, viewport) && clips.every((clip) => rectWithin(target, clip))
}
