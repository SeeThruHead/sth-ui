import { Equal, Option, Schema } from "effect"
import { defineMessageUnion } from "foldkit/message"
import { clampIntervalMinutes, timeSeconds } from "../dayLayout.ts"
import { addMinutes, dateOf, minutesBetween, timeOf } from "../datetime.ts"
import type { DateTimeString } from "../datetime.ts"
import { EventId } from "../events.ts"
import type { ScheduleEvent } from "../events.ts"
import { validatePlacement } from "../placement.ts"
import { lastDayOf } from "../weekLayout.ts"
import { addDays } from "@sth-ui/dates/date/date.ts"
import type { PreventEventOverlap } from "../placement.ts"

export const DragTarget = Schema.Literals(["slot", "midnight", "sameTime"])
export type DragTarget = typeof DragTarget.Type

export const Resource = Schema.Option(EventId)
export type Resource = typeof Resource.Type

export const Edge = Schema.Literals(["start", "end"])
export type Edge = typeof Edge.Type

const Range = { start: Schema.String, end: Schema.String, valid: Schema.Boolean }

export const Interaction = Schema.Union([
  Schema.TaggedStruct("Idle", {}),
  Schema.TaggedStruct("Dragging", { eventId: EventId, target: DragTarget, resourceId: Resource, ...Range }),
  Schema.TaggedStruct("Resizing", { eventId: EventId, edge: Edge, byDay: Schema.Boolean, ...Range }),
  Schema.TaggedStruct("Selecting", {
    date: Schema.String,
    resourceId: Resource,
    anchor: Schema.Int,
    current: Schema.Int
  }),
  Schema.TaggedStruct("SelectingDays", { anchor: Schema.String, current: Schema.String, resourceId: Resource })
])
export type Interaction = typeof Interaction.Type

export const Model = Schema.Struct({ interaction: Interaction })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  StartedDrag: {
    eventId: EventId,
    date: Schema.String,
    minutes: Schema.Finite,
    target: DragTarget,
    resourceId: Resource
  },
  StartedDaySelect: { date: Schema.String, resourceId: Resource },
  StartedResize: { eventId: EventId, edge: Edge, byDay: Schema.Boolean },
  StartedSelect: { date: Schema.String, minutes: Schema.Finite, resourceId: Resource },
  MovedPointer: { date: Schema.String, minutes: Schema.Finite, resourceId: Resource },
  Released: {},
  Cancelled: {},
  DroppedExternal: {
    date: Schema.String,
    minutes: Schema.Finite,
    resourceId: Resource,
    data: Schema.Record(Schema.String, Schema.String)
  }
})
export type Message = typeof Message.Type

const Rejection = {
  eventId: EventId,
  start: Schema.String,
  end: Schema.String,
  conflicts: Schema.Array(EventId),
  reason: Schema.Literals(["overlap", "rejected"])
}

export const OutMessage = defineMessageUnion({
  EventDropped: { eventId: EventId, newStart: Schema.String, newEnd: Schema.String, resourceId: Resource },
  EventResized: { eventId: EventId, newStart: Schema.String, newEnd: Schema.String },
  SlotsSelected: { rangeStart: Schema.String, rangeEnd: Schema.String, resourceId: Resource },
  ExternalEventDropped: {
    data: Schema.Record(Schema.String, Schema.String),
    start: Schema.String,
    resourceId: Resource
  },
  DropRejected: { ...Rejection, resourceId: Resource },
  ResizeRejected: { ...Rejection, edge: Edge }
})
export type OutMessage = typeof OutMessage.Type

export type InteractionContext = {
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly eventDragInterval?: number
  readonly eventResizeInterval?: number
  readonly preventEventOverlap?: PreventEventOverlap
  readonly canDropEvent?: (data: {
    readonly event: ScheduleEvent
    readonly start: DateTimeString
    readonly end: DateTimeString
    readonly resourceId: Resource
  }) => boolean
  readonly canDropExternalEvent?: (data: {
    readonly data: Readonly<Record<string, string>>
    readonly start: DateTimeString
    readonly resourceId: Resource
  }) => boolean
  readonly canResizeEventTo?: (data: {
    readonly event: ScheduleEvent
    readonly start: DateTimeString
    readonly end: DateTimeString
    readonly edge: Edge
  }) => boolean
}

export type Result = { readonly model: Model; readonly outMessages: ReadonlyArray<OutMessage> }

export const init = (): Model => ({ interaction: { _tag: "Idle" } })

type Grid = {
  readonly date: string
  readonly startMinutes: number
  readonly endMinutes: number
  readonly interval: number
  readonly span: number
}

export type Dated = InteractionContext & { readonly date: string }

export const gridOf = (context: Dated): Grid => {
  const startMinutes = timeSeconds(context.startTime ?? "00:00:00") / 60
  const endMinutes = Math.floor(timeSeconds(context.endTime ?? "23:59:59") / 60)
  const interval = clampIntervalMinutes(context.intervalMinutes ?? 15)

  return {
    date: context.date,
    startMinutes,
    endMinutes,
    interval,
    span: Math.ceil((endMinutes - startMinutes) / interval) * interval
  }
}

export const gridMinutes = (context: Dated): number => gridOf(context).span

const pad = (value: number) => String(value).padStart(2, "0")

const at = (grid: Grid, minutes: number): DateTimeString => {
  const total = grid.startMinutes + minutes

  return `${grid.date} ${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

const slotCount = (grid: Grid) => grid.span / grid.interval

export const slotIndexAt = (grid: Grid, minutes: number): number =>
  clamp(Math.floor(minutes / grid.interval), 0, slotCount(grid) - 1)

const snappedDragStart = (grid: Grid, minutes: number, dragInterval: number) => {
  const step = clampIntervalMinutes(dragInterval)
  const snapped = Math.round((grid.startMinutes + minutes) / step) * step
  const lowest = Math.ceil(grid.startMinutes / step) * step
  const highest = Math.floor((grid.endMinutes - 1) / step) * step
  if (lowest > highest) return 0

  return clamp(snapped, lowest, highest) - grid.startMinutes
}

export const dropRange = (
  context: Dated,
  event: ScheduleEvent,
  minutes: number
): { readonly start: DateTimeString; readonly end: DateTimeString } => {
  const grid = gridOf(context)
  const offset =
    context.eventDragInterval === undefined
      ? slotIndexAt(grid, minutes) * grid.interval
      : snappedDragStart(grid, minutes, context.eventDragInterval)
  const start = at(grid, offset)

  return { start, end: addMinutes(start, minutesBetween(event.start, event.end)) }
}

const offsetOf = (grid: Grid, value: DateTimeString) =>
  minutesBetween(`${grid.date} 00:00:00`, value) - grid.startMinutes

export const resizeRange = (
  context: Dated,
  event: ScheduleEvent,
  edge: Edge,
  minutes: number
): { readonly start: DateTimeString; readonly end: DateTimeString } => {
  const grid = gridOf(context)
  const step = clampIntervalMinutes(context.eventResizeInterval ?? grid.interval)
  const limit = grid.endMinutes - grid.startMinutes
  const snap = (value: number, round: (n: number) => number) =>
    clamp(round((grid.startMinutes + value) / step) * step - grid.startMinutes, 0, limit)
  const dragged = snap(minutes, Math.round)
  if (edge === "end") {
    const shortest = snap(offsetOf(grid, event.start) + step, Math.ceil)

    return { start: event.start, end: at(grid, Math.max(dragged, shortest)) }
  }
  const latest = snap(offsetOf(grid, event.end) - step, Math.floor)

  return { start: at(grid, Math.min(dragged, latest)), end: event.end }
}

export const selectionRange = (
  context: Dated,
  anchor: number,
  current: number
): { readonly rangeStart: DateTimeString; readonly rangeEnd: DateTimeString } => {
  const grid = gridOf(context)
  const first = Math.min(anchor, current)
  const last = Math.max(anchor, current)

  return {
    rangeStart: at(grid, first * grid.interval),
    rangeEnd: at(grid, Math.min((last + 1) * grid.interval, grid.endMinutes - grid.startMinutes))
  }
}

export type SelectedSlots = { readonly date: string; readonly first: number; readonly last: number }

export const selectedSlots = (model: Model): Option.Option<SelectedSlots> =>
  model.interaction._tag === "Selecting"
    ? Option.some({
        date: model.interaction.date,
        first: Math.min(model.interaction.anchor, model.interaction.current),
        last: Math.max(model.interaction.anchor, model.interaction.current)
      })
    : Option.none()

const eventById = (context: InteractionContext, eventId: EventId) =>
  Option.fromNullishOr(context.events.find((event) => event.id === eventId))

const placementFor = (
  context: InteractionContext,
  event: ScheduleEvent,
  start: DateTimeString,
  end: DateTimeString,
  resourceId: Resource,
  allow: () => boolean
) =>
  validatePlacement({
    event,
    start,
    end,
    events: context.events,
    allow,
    ...Option.match(resourceId, { onNone: () => ({}), onSome: (id) => ({ resourceId: id }) }),
    ...(context.preventEventOverlap === undefined ? {} : { preventEventOverlap: context.preventEventOverlap })
  })

const dropPlacement = (
  context: InteractionContext,
  event: ScheduleEvent,
  start: DateTimeString,
  end: DateTimeString,
  resourceId: Resource
) =>
  placementFor(
    context,
    event,
    start,
    end,
    resourceId,
    () => context.canDropEvent?.({ event, start, end, resourceId }) ?? true
  )

const resizePlacement = (
  context: InteractionContext,
  event: ScheduleEvent,
  edge: Edge,
  start: DateTimeString,
  end: DateTimeString
) =>
  placementFor(
    context,
    event,
    start,
    end,
    Option.fromNullishOr(event.resourceId),
    () => context.canResizeEventTo?.({ event, start, end, edge }) ?? true
  )

const sameResource = (event: ScheduleEvent, resourceId: Resource) =>
  Option.match(resourceId, { onNone: () => true, onSome: (id) => id === event.resourceId })

const idle = (outMessages: ReadonlyArray<OutMessage> = []): Result => ({ model: init(), outMessages })

const stay = (model: Model): Result => ({ model, outMessages: [] })

const dayRange = (event: ScheduleEvent, date: string, time: string) => {
  const start = `${date} ${time}`

  return { start, end: addMinutes(start, minutesBetween(event.start, event.end)) }
}

const rangeFor = (
  context: InteractionContext,
  event: ScheduleEvent,
  date: string,
  minutes: number,
  target: DragTarget
) => {
  if (target === "midnight") return dayRange(event, date, "00:00:00")
  if (target === "sameTime") return dayRange(event, date, timeOf(event.start))

  return dropRange({ ...context, date }, event, minutes)
}

const dragTo = (
  context: InteractionContext,
  eventId: EventId,
  date: string,
  minutes: number,
  target: DragTarget,
  resourceId: Resource
): Option.Option<Interaction> =>
  Option.map(eventById(context, eventId), (event) => {
    const range = rangeFor(context, event, date, minutes, target)

    return {
      _tag: "Dragging",
      eventId,
      target,
      resourceId,
      ...range,
      valid: dropPlacement(context, event, range.start, range.end, resourceId).valid
    }
  })

export const dayResizeRange = (
  event: ScheduleEvent,
  edge: Edge,
  date: string
): { readonly start: DateTimeString; readonly end: DateTimeString } => {
  if (edge === "start") {
    const last = lastDayOf(event)

    return { start: `${date < last ? date : last} ${timeOf(event.start)}`, end: event.end }
  }
  const day = date > dateOf(event.start) ? date : dateOf(event.start)
  const midnight = timeOf(event.end) === "00:00:00" && dateOf(event.end) > dateOf(event.start)

  return { start: event.start, end: midnight ? `${addDays(day, 1)} 00:00:00` : `${day} ${timeOf(event.end)}` }
}

const resizeTo = (
  context: InteractionContext,
  interaction: Extract<Interaction, { _tag: "Resizing" }>,
  date: string,
  minutes: number
): Option.Option<Interaction> =>
  Option.map(eventById(context, interaction.eventId), (event) => {
    const { edge } = interaction
    const range = interaction.byDay
      ? dayResizeRange(event, edge, date)
      : resizeRange({ ...context, date: dateOf(event.start) }, event, edge, minutes)

    return {
      ...interaction,
      ...range,
      valid: resizePlacement(context, event, edge, range.start, range.end).valid
    }
  })

const startResize = (
  context: InteractionContext,
  eventId: EventId,
  edge: Edge,
  byDay: boolean
): Option.Option<Interaction> =>
  Option.map(eventById(context, eventId), (event) => ({
    _tag: "Resizing",
    eventId,
    edge,
    byDay,
    start: event.start,
    end: event.end,
    valid: true
  }))

const movedDays = (
  interaction: Extract<Interaction, { _tag: "SelectingDays" }>,
  date: string,
  resourceId: Resource
): Result => {
  if (!Equal.equals(interaction.resourceId, resourceId)) return stay({ interaction })

  return stay({ interaction: { ...interaction, current: date } })
}

const moved = (
  model: Model,
  context: InteractionContext,
  date: string,
  minutes: number,
  resourceId: Resource
): Result => {
  const interaction = model.interaction
  if (interaction._tag === "Dragging") {
    return stay({
      interaction: Option.getOrElse(
        dragTo(context, interaction.eventId, date, minutes, interaction.target, resourceId),
        () => interaction
      )
    })
  }
  if (interaction._tag === "Resizing") {
    return stay({
      interaction: Option.getOrElse(resizeTo(context, interaction, date, minutes), () => interaction)
    })
  }
  if (interaction._tag === "SelectingDays") return movedDays(interaction, date, resourceId)
  if (interaction._tag !== "Selecting") return stay(model)
  if (interaction.date !== date) return stay(model)
  if (!Equal.equals(interaction.resourceId, resourceId)) return stay(model)

  return stay({ interaction: { ...interaction, current: slotIndexAt(gridOf({ ...context, date }), minutes) } })
}

const dropped = (context: InteractionContext, interaction: Extract<Interaction, { _tag: "Dragging" }>): Result =>
  Option.match(eventById(context, interaction.eventId), {
    onNone: () => idle(),
    onSome: (event) => {
      if (event.start === interaction.start && sameResource(event, interaction.resourceId)) return idle()
      const placement = dropPlacement(context, event, interaction.start, interaction.end, interaction.resourceId)
      if (!placement.valid) {
        return idle([
          OutMessage.DropRejected({
            eventId: event.id,
            start: interaction.start,
            end: interaction.end,
            conflicts: placement.conflicts.map((conflict) => conflict.id),
            reason: placement.reason,
            resourceId: interaction.resourceId
          })
        ])
      }

      return idle([
        OutMessage.EventDropped({
          eventId: event.id,
          newStart: interaction.start,
          newEnd: interaction.end,
          resourceId: interaction.resourceId
        })
      ])
    }
  })

const resized = (context: InteractionContext, interaction: Extract<Interaction, { _tag: "Resizing" }>): Result =>
  Option.match(eventById(context, interaction.eventId), {
    onNone: () => idle(),
    onSome: (event) => {
      if (event.start === interaction.start && event.end === interaction.end) return idle()
      const placement = resizePlacement(context, event, interaction.edge, interaction.start, interaction.end)
      if (!placement.valid) {
        return idle([
          OutMessage.ResizeRejected({
            eventId: event.id,
            start: interaction.start,
            end: interaction.end,
            edge: interaction.edge,
            conflicts: placement.conflicts.map((conflict) => conflict.id),
            reason: placement.reason
          })
        ])
      }

      return idle([
        OutMessage.EventResized({ eventId: event.id, newStart: interaction.start, newEnd: interaction.end })
      ])
    }
  })

const releasedDays = (interaction: Extract<Interaction, { _tag: "SelectingDays" }>): Result => {
  if (interaction.anchor === interaction.current) return idle()
  const first = interaction.anchor < interaction.current ? interaction.anchor : interaction.current
  const last = interaction.anchor < interaction.current ? interaction.current : interaction.anchor

  return idle([
    OutMessage.SlotsSelected({
      rangeStart: `${first} 00:00:00`,
      rangeEnd: `${last} 23:59:59`,
      resourceId: interaction.resourceId
    })
  ])
}

const released = (model: Model, context: InteractionContext): Result => {
  const interaction = model.interaction
  if (interaction._tag === "Dragging") return dropped(context, interaction)
  if (interaction._tag === "Resizing") return resized(context, interaction)
  if (interaction._tag === "SelectingDays") return releasedDays(interaction)
  if (interaction._tag !== "Selecting") return idle()
  if (interaction.anchor === interaction.current) return idle()

  return idle([
    OutMessage.SlotsSelected({
      ...selectionRange({ ...context, date: interaction.date }, interaction.anchor, interaction.current),
      resourceId: interaction.resourceId
    })
  ])
}

export const update = (model: Model, message: Message, context: InteractionContext): Result =>
  Message.match(message, {
    StartedDaySelect: ({ date, resourceId }) =>
      stay({ interaction: { _tag: "SelectingDays", anchor: date, current: date, resourceId } }),
    StartedDrag: ({ eventId, date, minutes, target, resourceId }) =>
      stay({
        interaction: Option.getOrElse(
          dragTo(context, eventId, date, minutes, target, resourceId),
          () => model.interaction
        )
      }),
    StartedResize: ({ eventId, edge, byDay }) =>
      stay({ interaction: Option.getOrElse(startResize(context, eventId, edge, byDay), () => model.interaction) }),
    StartedSelect: ({ date, minutes, resourceId }) => {
      const index = slotIndexAt(gridOf({ ...context, date }), minutes)

      return stay({ interaction: { _tag: "Selecting", date, resourceId, anchor: index, current: index } })
    },
    MovedPointer: ({ date, minutes, resourceId }) => moved(model, context, date, minutes, resourceId),
    Released: () => released(model, context),
    Cancelled: () => idle(),
    DroppedExternal: ({ date, minutes, data, resourceId }) => {
      const grid = gridOf({ ...context, date })
      const start = at(grid, slotIndexAt(grid, minutes) * grid.interval)
      if (context.canDropExternalEvent?.({ data, start, resourceId }) === false) return idle()

      return idle([OutMessage.ExternalEventDropped({ data, start, resourceId })])
    }
  })
