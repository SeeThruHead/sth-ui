import { addDays, dayOfWeek, startOfWeek } from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { dayPosition, isAllDayEvent, isEventInTimeRange, isEventsOverlap, positionDayEvents } from "./dayLayout.ts"
import type { DayPositionedEvent, EventOverlapMode } from "./dayLayout.ts"
import { dateOf, fromSeconds, secondsOf, timeOf } from "./datetime.ts"
import type { ScheduleEvent } from "./events.ts"
import { sortEvents } from "./recurrence.ts"
import { Array as Arr, Option } from "effect"

export type Hanging = "start" | "end" | "both" | "none"

export type WeekAllDayEvent = ScheduleEvent & {
  readonly position: {
    readonly row: number
    readonly rows: number
    readonly offset: number
    readonly width: number
    readonly hanging: Hanging
  }
}

export type WeekDayEvents = {
  readonly date: DateString
  readonly regularEvents: ReadonlyArray<DayPositionedEvent>
  readonly backgroundEvents: ReadonlyArray<DayPositionedEvent>
}

export type WeekViewEvents = {
  readonly days: ReadonlyArray<DateString>
  readonly allDayEvents: ReadonlyArray<WeekAllDayEvent>
  readonly dayEvents: ReadonlyArray<WeekDayEvents>
}

export type WeekOptions = {
  readonly firstDayOfWeek?: DayOfWeek
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly withWeekendDays?: boolean
}

export const weekDays = (date: DateString, options: WeekOptions = {}): Arr.NonEmptyReadonlyArray<DateString> => {
  const start = startOfWeek(date, options.firstDayOfWeek ?? 1)
  const weekend = options.weekendDays ?? [0, 6]
  const all = Arr.makeBy(7, (index) => addDays(start, index))
  const workdays = all.filter((day) => !weekend.includes(dayOfWeek(day)))
  if (options.withWeekendDays !== false) return all

  return Arr.isReadonlyArrayNonEmpty(workdays) ? workdays : all
}

export const lastDayOf = (event: Pick<ScheduleEvent, "start" | "end">): DateString =>
  timeOf(event.end) === "00:00:00" && dateOf(event.end) > dateOf(event.start)
    ? addDays(dateOf(event.end), -1)
    : dateOf(event.end)

const coveredDays = (event: ScheduleEvent, days: ReadonlyArray<DateString>) =>
  days.filter((day) => day >= dateOf(event.start) && day <= lastDayOf(event))

const hangingOf = (event: ScheduleEvent, days: ReadonlyArray<DateString>): Hanging => {
  const start = days.every((day) => day > dateOf(event.start))
  const end = days.every((day) => day < lastDayOf(event))
  if (start && end) return "both"
  if (start) return "start"

  return end ? "end" : "none"
}

const isWeekAllDay = (event: ScheduleEvent, days: ReadonlyArray<DateString>) =>
  lastDayOf(event) > dateOf(event.start) || coveredDays(event, days).some((day) => isAllDayEvent(event, day))

type Rowed = { readonly event: ScheduleEvent; readonly row: number }

const assignRows = (events: ReadonlyArray<ScheduleEvent>): ReadonlyArray<Rowed> =>
  events.reduce<ReadonlyArray<Rowed>>((placed, event) => {
    const taken = placed.filter((other) => isEventsOverlap(other.event, event)).map((other) => other.row)
    const row = Array.from({ length: taken.length + 1 }, (_, candidate) => taken.includes(candidate)).indexOf(false)

    return [...placed, { event, row }]
  }, [])

const clipped = (event: ScheduleEvent, day: DateString): ScheduleEvent => {
  const start = secondsOf(`${day} 00:00:00`)

  return {
    ...event,
    start: fromSeconds(Math.max(secondsOf(event.start), start)),
    end: fromSeconds(Math.min(secondsOf(event.end), start + 86_399))
  }
}

const background = (
  event: ScheduleEvent,
  day: DateString,
  range: { readonly startTime?: string; readonly endTime?: string; readonly intervalMinutes?: number }
): Option.Option<DayPositionedEvent> => {
  const piece = clipped(event, day)
  const allDay = isAllDayEvent(piece, day)
  const vertical = allDay ? { top: 0, height: 100 } : dayPosition({ event: piece, ...range })
  if (!allDay && vertical.height <= 0) return Option.none()

  return Option.some({ ...event, position: { ...vertical, allDay, column: 0, width: 100, offset: 0, overlaps: 1 } })
}

const firstOfEach = (events: ReadonlyArray<ScheduleEvent>) =>
  events.filter((event, index) => events.findIndex((other) => other.id === event.id) === index)

export const weekViewEvents = (
  input: WeekOptions & {
    readonly events: ReadonlyArray<ScheduleEvent>
    readonly date: DateString
    readonly startTime?: string
    readonly endTime?: string
    readonly intervalMinutes?: number
    readonly eventOverlapMode?: EventOverlapMode
  }
): WeekViewEvents => {
  const days = weekDays(input.date, input)
  const range = {
    ...(input.startTime === undefined ? {} : { startTime: input.startTime }),
    ...(input.endTime === undefined ? {} : { endTime: input.endTime }),
    ...(input.intervalMinutes === undefined ? {} : { intervalMinutes: input.intervalMinutes })
  }
  const shown = sortEvents(
    firstOfEach(
      input.events.filter(
        (event) => coveredDays(event, days).length > 0 && isEventInTimeRange(event, input.startTime, input.endTime)
      )
    )
  )
  const foreground = shown.filter((event) => event.display !== "background")
  const backgrounds = shown.filter((event) => event.display === "background")
  const allDay = foreground.filter((event) => isWeekAllDay(event, days))
  const timed = foreground.filter((event) => !isWeekAllDay(event, days))
  const rows = assignRows(allDay)
  const rowCount = Math.max(0, ...rows.map((placed) => placed.row)) + 1
  const share = (count: number) => (count / days.length) * 100

  return {
    days,
    allDayEvents: rows.map(({ event, row }) => ({
      ...event,
      position: {
        row,
        rows: rowCount,
        offset: share(days.findIndex((day) => day >= dateOf(event.start))),
        width: share(coveredDays(event, days).length),
        hanging: hangingOf(event, days)
      }
    })),
    dayEvents: days.map((date) => ({
      date,
      regularEvents: positionDayEvents({
        ...range,
        ...(input.eventOverlapMode === undefined ? {} : { eventOverlapMode: input.eventOverlapMode }),
        events: timed.filter((event) => dateOf(event.start) === date),
        date
      }),
      backgroundEvents: backgrounds
        .filter((event) => coveredDays(event, [date]).length > 0)
        .flatMap((event) => Option.toArray(background(event, date, range)))
    }))
  }
}
