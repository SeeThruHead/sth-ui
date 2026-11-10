import { addDays } from "@sth-ui/dates/date/date.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { compareDateTime, dateOf, fromSeconds, minutesOfDay, toSeconds } from "./datetime.ts"
import type { DateTimeString } from "./datetime.ts"
import type { ScheduleEvent } from "./events.ts"
import { sortEvents } from "./recurrence.ts"
import { Option } from "effect"

export type EventOverlapMode = "columns" | "cascade"

export type DayEventPosition = {
  readonly allDay: boolean
  readonly top: number
  readonly height: number
  readonly width: number
  readonly offset: number
  readonly overlaps: number
  readonly column: number
}

export type DayPositionedEvent = ScheduleEvent & { readonly position: DayEventPosition }

export type DayTimeInterval = {
  readonly startTime: string
  readonly endTime: string
  readonly duration: number
  readonly isHourStart: boolean
  readonly isLabelStart: boolean
}

export const clampIntervalMinutes = (intervalMinutes: number): number => {
  const rounded = Math.round(Math.max(1, Math.min(1440, intervalMinutes)))
  if (rounded <= 60) return 60 % rounded === 0 ? rounded : 60

  return rounded % 60 === 0 ? rounded : 60
}

const nextLabel = (value: number, interval: number): number =>
  value < 1440 && clampIntervalMinutes(value) !== value ? nextLabel(value + interval, interval) : value

export const clampSlotLabelInterval = (slotLabelInterval: number, intervalMinutes: number): number => {
  const interval = clampIntervalMinutes(intervalMinutes)
  const label = clampIntervalMinutes(
    Number.isFinite(slotLabelInterval) && slotLabelInterval > 0 ? slotLabelInterval : 60
  )

  return Math.min(1440, nextLabel(Math.ceil(label / interval) * interval, interval))
}

export const timeSeconds = (time: string): number =>
  time
    .split(":")
    .slice(0, 3)
    .reduce((sum, part, index) => sum + (Number(part) || 0) * 60 ** (2 - index), 0)

const pad = (value: number) => String(value).padStart(2, "0")

export const timeString = (seconds: number): string =>
  `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`

export const dayTimeIntervals = (input: {
  readonly startTime: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly labelIntervalMinutes?: number
}): ReadonlyArray<DayTimeInterval> => {
  const interval = clampIntervalMinutes(input.intervalMinutes ?? 60) * 60
  const labelInterval = clampSlotLabelInterval(input.labelIntervalMinutes ?? 60, input.intervalMinutes ?? 60) * 60
  const start = timeSeconds(input.startTime)
  const end = timeSeconds(input.endTime ?? "23:59:59")
  const origin = (start % labelInterval) % interval === 0 ? 0 : start
  const count = Math.max(0, Math.ceil((end - start) / interval))

  return Array.from({ length: count }, (_, index) => {
    const from = start + index * interval
    const to = Math.min(from + interval, end)

    return {
      startTime: timeString(from),
      endTime: timeString(to),
      duration: to - from,
      isHourStart: from % 3600 === 0,
      isLabelStart: (from - origin) % labelInterval === 0
    }
  })
}

const secondsOf = (value: DateTimeString) => Option.getOrElse(toSeconds(value), () => 0)

export const isEventsOverlap = (a: ScheduleEvent, b: ScheduleEvent): boolean =>
  secondsOf(a.start) < secondsOf(b.end) && secondsOf(b.start) < secondsOf(a.end)

const dayStartSeconds = (date: DateString) => secondsOf(`${date} 00:00:00`)

const fullDayOf = (event: ScheduleEvent, date: DateString) => {
  const start = dayStartSeconds(date)
  const end = secondsOf(event.end)
  if (secondsOf(event.start) !== start) return false

  return end === start + 86_400 || end === start + 86_399
}

export const isAllDayEvent = (event: ScheduleEvent, date: DateString): boolean => fullDayOf(event, date)

export const isMultidayEvent = (event: ScheduleEvent): boolean => {
  const end = secondsOf(event.end)
  const endDay = Math.floor(end / 86_400) - (end % 86_400 === 0 ? 1 : 0)

  return endDay > Math.floor(secondsOf(event.start) / 86_400)
}

const minutesWindow = (startTime: string, endTime: string) => ({
  start: timeSeconds(startTime) / 60,
  end: timeSeconds(endTime) / 60
})

export const isEventInTimeRange = (event: ScheduleEvent, startTime?: string, endTime?: string): boolean => {
  if (isMultidayEvent(event) || fullDayOf(event, dateOf(event.start))) return true
  if (startTime === undefined || endTime === undefined) return true
  const window = minutesWindow(startTime, endTime)
  const startMinutes = Math.floor(minutesOfDay(event.start))
  const endsNextDay = secondsOf(event.end) === dayStartSeconds(dateOf(event.start)) + 86_400
  const endMinutes = endsNextDay ? 1440 : Math.floor(minutesOfDay(event.end))

  return endMinutes > window.start && startMinutes < window.end
}

const rangeSeconds = (startTime: string, endTime: string, intervalMinutes: number) => {
  const interval = clampIntervalMinutes(intervalMinutes) * 60

  return Math.ceil((timeSeconds(endTime) - timeSeconds(startTime)) / interval) * interval
}

export const dayPosition = (input: {
  readonly event: ScheduleEvent
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
}): { readonly top: number; readonly height: number } => {
  const startTime = input.startTime ?? "00:00:00"
  const endTime = input.endTime ?? "23:59:59"
  const total = rangeSeconds(startTime, endTime, input.intervalMinutes ?? 60)
  const day = dayStartSeconds(dateOf(input.event.start))
  const from = Math.max(secondsOf(input.event.start) - day, timeSeconds(startTime)) - timeSeconds(startTime)
  const to = Math.min(secondsOf(input.event.end) - day, timeSeconds(endTime)) - timeSeconds(startTime)
  const top = (from / total) * 100

  return { top, height: (to / total) * 100 - top }
}

export const currentTimePosition = (input: {
  readonly now: DateTimeString
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
}): number => {
  const now = secondsOf(input.now) - dayStartSeconds(dateOf(input.now))
  if (input.startTime === undefined || input.endTime === undefined) return (Math.floor(now / 60) / 1440) * 100
  const literal = timeSeconds(input.endTime) - timeSeconds(input.startTime)
  const total =
    input.intervalMinutes === undefined ? literal : rangeSeconds(input.startTime, input.endTime, input.intervalMinutes)

  return ((now - timeSeconds(input.startTime)) / total) * 100
}

export const overlapClusters = <A extends ScheduleEvent>(events: ReadonlyArray<A>): ReadonlyArray<ReadonlyArray<A>> =>
  events.reduce<ReadonlyArray<ReadonlyArray<A>>>((clusters, event) => {
    const joined = clusters.filter((cluster) => cluster.some((other) => isEventsOverlap(other, event)))
    const rest = clusters.filter((cluster) => !joined.includes(cluster))

    return [...rest, [...joined.flat(), event]]
  }, [])

const allDayOn = (event: ScheduleEvent, date: DateString) =>
  isAllDayEvent(event, date) || (isMultidayEvent(event) && compareDateTime(event.start, `${date} 00:00:00`) === 0)

type Placed = { readonly event: ScheduleEvent; readonly allDay: boolean; readonly column: number }

const placeColumns = (events: ReadonlyArray<ScheduleEvent>, date: DateString): ReadonlyArray<Placed> =>
  sortEvents(events).reduce<{
    readonly columns: ReadonlyArray<ReadonlyArray<ScheduleEvent>>
    readonly placed: ReadonlyArray<Placed>
  }>(
    (state, event) => {
      const allDay = allDayOn(event, date)
      const conflict = (column: ReadonlyArray<ScheduleEvent>) =>
        !allDay && column.some((other) => !allDayOn(other, date) && isEventsOverlap(other, event))
      const found = state.columns.findIndex((column) => !conflict(column))
      const column = found === -1 ? state.columns.length : found
      const columns =
        column === state.columns.length
          ? [...state.columns, [event]]
          : state.columns.map((items, index) => (index === column ? [...items, event] : items))

      return { columns, placed: [...state.placed, { event, allDay, column }] }
    },
    { columns: [], placed: [] }
  ).placed

const cascadeStep = 20

const minTopWidth = 60

const cascade = (positioned: ReadonlyArray<DayPositionedEvent>): ReadonlyArray<DayPositionedEvent> => {
  const clusters = overlapClusters(positioned.filter((event) => !event.position.allDay))
  const layout = new Map(
    clusters.flatMap((cluster) => {
      const columns = Math.max(...cluster.map((event) => event.position.column)) + 1
      const step = columns > 1 ? Math.min(cascadeStep, (100 - minTopWidth) / (columns - 1)) : 0

      return cluster.map((event) => [event, { overlaps: columns, offset: event.position.column * step }] as const)
    })
  )

  return positioned.map((event) =>
    Option.match(Option.fromNullishOr(layout.get(event)), {
      onNone: () => event,
      onSome: ({ overlaps, offset }) => ({
        ...event,
        position: { ...event.position, overlaps, offset, width: 100 - offset }
      })
    })
  )
}

const columnLayout =
  (positioned: ReadonlyArray<DayPositionedEvent>) =>
  (event: DayPositionedEvent): DayPositionedEvent => {
    if (event.position.allDay) return event
    const timed = positioned.filter((other) => !other.position.allDay)
    const direct = timed.filter((other) => other !== event && isEventsOverlap(other, event))
    const maxColumn = Math.max(
      event.position.column,
      ...direct.flatMap((overlapping) => [
        overlapping.position.column,
        ...timed
          .filter((other) => other !== overlapping && isEventsOverlap(other, overlapping))
          .map((other) => other.position.column)
      ])
    )
    const total = maxColumn + 1
    const next = Math.min(
      total,
      ...direct.map((other) => other.position.column).filter((column) => column > event.position.column)
    )

    return {
      ...event,
      position: {
        ...event.position,
        overlaps: total,
        width: ((next - event.position.column) / total) * 100,
        offset: (event.position.column * 100) / total
      }
    }
  }

export const positionDayEvents = (input: {
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly date: DateString
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly eventOverlapMode?: EventOverlapMode
}): ReadonlyArray<DayPositionedEvent> => {
  const positioned = placeColumns(input.events, input.date).map(({ event, allDay, column }): DayPositionedEvent => ({
    ...event,
    position: {
      ...(allDay ? { top: 0, height: 100 } : dayPosition({ event, ...optionalRange(input) })),
      allDay,
      column,
      width: allDay ? 100 : 0,
      offset: 0,
      overlaps: allDay ? 1 : 0
    }
  }))

  return input.eventOverlapMode === "cascade" ? cascade(positioned) : positioned.map(columnLayout(positioned))
}

const optionalRange = (input: {
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
}) => ({
  ...(input.startTime === undefined ? {} : { startTime: input.startTime }),
  ...(input.endTime === undefined ? {} : { endTime: input.endTime }),
  ...(input.intervalMinutes === undefined ? {} : { intervalMinutes: input.intervalMinutes })
})

export type DayViewEvents = {
  readonly allDayEvents: ReadonlyArray<DayPositionedEvent>
  readonly regularEvents: ReadonlyArray<DayPositionedEvent>
  readonly backgroundTimedEvents: ReadonlyArray<DayPositionedEvent>
  readonly backgroundAllDayEvents: ReadonlyArray<DayPositionedEvent>
}

const fullPosition: DayEventPosition = {
  top: 0,
  height: 100,
  allDay: true,
  width: 100,
  offset: 0,
  column: 0,
  overlaps: 1
}

const onDay = (event: ScheduleEvent, date: DateString) => dateOf(event.start) === date

const spansInto = (event: ScheduleEvent, date: DateString) => {
  if (onDay(event, date) || event.display !== "background") return false
  const start = dayStartSeconds(date)

  return secondsOf(event.start) < start + 86_399 && secondsOf(event.end) > start
}

const firstOfEach = (events: ReadonlyArray<ScheduleEvent>) =>
  events.filter((event, index) => events.findIndex((other) => other.id === event.id) === index)

const clipped = (event: ScheduleEvent, date: DateString): ScheduleEvent => {
  const start = dayStartSeconds(date)

  return {
    ...event,
    start: fromSeconds(Math.max(secondsOf(event.start), start)),
    end: fromSeconds(Math.min(secondsOf(event.end), start + 86_399))
  }
}

export const dayViewEvents = (input: {
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly date: DateString
  readonly startTime?: string
  readonly endTime?: string
  readonly intervalMinutes?: number
  readonly eventOverlapMode?: EventOverlapMode
}): DayViewEvents => {
  const { date } = input
  const shown = firstOfEach(
    input.events.filter((event) => {
      if (spansInto(event, date)) return true

      return onDay(event, date) && isEventInTimeRange(event, input.startTime, input.endTime)
    })
  )
  const positioned = positionDayEvents({ ...input, events: shown.filter((event) => event.display !== "background") })
  const background = shown.filter((event) => event.display === "background")
  const backgroundAllDay = background.filter((event) => isAllDayEvent(clipped(event, date), date))
  const backgroundTimed = background
    .filter((event) => !isAllDayEvent(clipped(event, date), date))
    .map((event): DayPositionedEvent => ({
      ...event,
      position: {
        ...fullPosition,
        ...dayPosition({ event: clipped(event, date), ...optionalRange(input) }),
        allDay: false
      }
    }))
    .filter((event) => event.position.height > 0)

  return {
    allDayEvents: positioned.filter((event) => event.position.allDay),
    regularEvents: positioned.filter((event) => !event.position.allDay),
    backgroundTimedEvents: backgroundTimed,
    backgroundAllDayEvents: backgroundAllDay.map((event) => ({ ...event, position: fullPosition }))
  }
}

export const nextDay = (date: DateString): DateString => addDays(date, 1)
