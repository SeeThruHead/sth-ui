import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { ScrollBy, ScrollTo } from "./commands.ts"

const Drag = Schema.Struct({ startX: Schema.Finite, startScroll: Schema.Finite })

export const Model = Schema.Struct({
  id: Schema.String,
  canScrollStart: Schema.Boolean,
  canScrollEnd: Schema.Boolean,
  scrollLeft: Schema.Finite,
  drag: Schema.NullOr(Drag)
})

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  id: config.id,
  canScrollStart: false,
  canScrollEnd: false,
  scrollLeft: 0,
  drag: null
})

export const Message = defineMessageUnion({
  Scrolled: { canScrollStart: Schema.Boolean, canScrollEnd: Schema.Boolean, scrollLeft: Schema.Finite },
  PressedStart: {},
  PressedEnd: {},
  Pressed: { x: Schema.Finite },
  Moved: { x: Schema.Finite },
  Released: {},
  CompletedScroll: {}
})

export type Message = typeof Message.Type

export type ScrollerContext = { readonly scrollAmount?: number; readonly draggable?: boolean }

export type Result = { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> }

const still = (model: Model): Result => ({ model, commands: [] })

const containerId = (model: Model) => `${model.id}-container`

const scrolled = () => Message.CompletedScroll()

const scrollBy = (model: Model, amount: number): Result => ({
  model,
  commands: [Command.mapMessage(ScrollBy({ id: containerId(model), amount }), scrolled)]
})

export type ScrollMetrics = {
  readonly scrollLeft: number
  readonly scrollWidth: number
  readonly clientWidth: number
  readonly rtl: boolean
}

export const scrollState = (metrics: ScrollMetrics) => {
  const end = metrics.scrollWidth - metrics.clientWidth

  return metrics.rtl
    ? { canScrollStart: metrics.scrollLeft < -1, canScrollEnd: metrics.scrollLeft > -end + 1 }
    : { canScrollStart: metrics.scrollLeft > 1, canScrollEnd: metrics.scrollLeft < end - 1 }
}

export const update = (model: Model, message: Message, context: ScrollerContext = {}): Result =>
  Message.match(message, {
    Scrolled: ({ canScrollStart, canScrollEnd, scrollLeft }) =>
      still({ ...model, canScrollStart, canScrollEnd, scrollLeft }),
    PressedStart: () => scrollBy(model, -(context.scrollAmount ?? 200)),
    PressedEnd: () => scrollBy(model, context.scrollAmount ?? 200),
    Pressed: ({ x }) =>
      context.draggable === false
        ? still(model)
        : still({ ...model, drag: { startX: x, startScroll: model.scrollLeft } }),
    Moved: ({ x }) =>
      model.drag === null
        ? still(model)
        : {
            model,
            commands: [
              Command.mapMessage(
                ScrollTo({ id: containerId(model), left: model.drag.startScroll - (x - model.drag.startX) }),
                scrolled
              )
            ]
          },
    Released: () => still(model.drag === null ? model : { ...model, drag: null }),
    CompletedScroll: () => still(model)
  })
