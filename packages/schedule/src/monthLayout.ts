import {
  addDays,
  dayNumber,
  dayOfWeek,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek
} from "@sth-ui/dates/date/date.ts"
import type { DateString, DayOfWeek } from "@sth-ui/dates/date/date.ts"
import { Array as Arr } from "effect"
import { dateOf } from "./datetime.ts"
import type { ScheduleEvent } from "./events.ts"
import { sortEvents } from "./recurrence.ts"
import { lastDayOf, weekDays } from "./weekLayout.ts"
import type { Hanging } from "./weekLayout.ts"

export type MonthSegment = {
  readonly event: ScheduleEvent
  readonly row: number
  readonly offset: number
  readonly width: number
  readonly hanging: Hanging
  readonly clipStart: boolean
  readonly clipEnd: boolean
}

export type MonthSpan = { readonly event: ScheduleEvent; readonly offset: number; readonly width: number }

export type MonthDayEvents = {
  readonly date: DateString
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly hidden: number
}

export type MonthWeek = {
  readonly days: Arr.NonEmptyReadonlyArray<DateString>
  readonly segments: ReadonlyArray<MonthSegment>
  readonly background: ReadonlyArray<MonthSpan>
  readonly dayEvents: ReadonlyArray<MonthDayEvents>
}

export type MonthOptions = {
  readonly firstDayOfWeek?: DayOfWeek
  readonly withOutsideDays?: boolean
  readonly consistentWeeks?: boolean
  readonly withWeekendDays?: boolean
  readonly weekendDays?: ReadonlyArray<DayOfWeek>
  readonly maxEventsPerDay?: number
}

type Placed = { readonly event: ScheduleEvent; readonly first: number; readonly last: number; readonly row: number }

export const clampMaxEvents = (value: number | undefined): number => Math.min(10, Math.max(1, value ?? 2))

const coverage = (event: ScheduleEvent, days: ReadonlyArray<DateString>) => {
  const indexes = days.flatMap((day, index) => (day >= dateOf(event.start) && day <= lastDayOf(event) ? [index] : []))

  return { first: Math.min(...indexes), last: Math.max(...indexes), covered: indexes.length > 0 }
}

const hangingOf = (event: ScheduleEvent, days: ReadonlyArray<DateString>, first: boolean, last: boolean): Hanging => {
  const start = first && days.every((day) => day > dateOf(event.start))
  const end = last && days.every((day) => day < lastDayOf(event))
  if (start && end) return "both"
  if (start) return "start"

  return end ? "end" : "none"
}

const reserveRows = (events: ReadonlyArray<ScheduleEvent>, days: ReadonlyArray<DateString>): ReadonlyArray<Placed> =>
  events.reduce<{ readonly next: ReadonlyArray<number>; readonly placed: ReadonlyArray<Placed> }>(
    (state, event) => {
      const { first, last } = coverage(event, days)
      const row = Math.max(...state.next.slice(first, last + 1))

      return {
        next: state.next.map((value, index) => (index >= first && index <= last ? row + 1 : value)),
        placed: [...state.placed, { event, first, last, row }]
      }
    },
    { next: days.map(() => 0), placed: [] }
  ).placed

type Rowed = Placed & { readonly index: number; readonly rows: ReadonlyArray<number | undefined> }

const assignDay = (state: ReadonlyArray<Rowed>, day: number, max: number): ReadonlyArray<Rowed> => {
  const covering = state.filter((entry) => entry.first <= day && entry.last >= day)
  const candidates = covering.length > max ? covering.filter((entry) => entry.row < max) : covering
  const ordered = candidates.toSorted((a, b) => a.row - b.row)
  const assigned = ordered.reduce<ReadonlyArray<{ readonly index: number; readonly row: number }>>((taken, entry) => {
    const used = taken.map((item) => item.row)
    const wanted = entry.rows[day - 1] ?? entry.row
    const row =
      wanted < max && !used.includes(wanted)
        ? wanted
        : Array.from({ length: max }, (_, candidate) => used.includes(candidate)).indexOf(false)

    return [...taken, { index: entry.index, row }]
  }, [])

  return state.map((entry) => ({
    ...entry,
    rows: [...entry.rows, assigned.find((item) => item.index === entry.index)?.row]
  }))
}

const compactRows = (placed: ReadonlyArray<Placed>, dayCount: number, max: number): ReadonlyArray<Rowed> =>
  Array.from({ length: dayCount }, (_, day) => day).reduce<ReadonlyArray<Rowed>>(
    (state, day) => assignDay(state, day, max),
    placed.map((entry, index) => ({ ...entry, index, rows: [] }))
  )

type Run = { readonly first: number; readonly last: number; readonly row: number }

const runsOf = (rows: ReadonlyArray<number | undefined>): ReadonlyArray<Run> =>
  rows.reduce<ReadonlyArray<Run>>((runs, row, day) => {
    if (row === undefined) return runs
    const previous = runs.at(-1)
    if (previous !== undefined && previous.last === day - 1 && previous.row === row) {
      return [...runs.slice(0, -1), { ...previous, last: day }]
    }

    return [...runs, { first: day, last: day, row }]
  }, [])

const segmentsOf = (rowed: ReadonlyArray<Rowed>, days: ReadonlyArray<DateString>): ReadonlyArray<MonthSegment> =>
  rowed.flatMap((entry) =>
    runsOf(entry.rows).map((run) => ({
      event: entry.event,
      row: run.row,
      offset: (run.first / days.length) * 100,
      width: ((run.last - run.first + 1) / days.length) * 100,
      hanging: hangingOf(entry.event, days, run.first === entry.first, run.last === entry.last),
      clipStart: run.first > entry.first,
      clipEnd: run.last < entry.last
    }))
  )

const firstOfEach = (events: ReadonlyArray<ScheduleEvent>) =>
  events.filter((event, index) => events.findIndex((other) => other.id === event.id) === index)

export const monthWeeks = (
  date: DateString,
  options: MonthOptions = {}
): Arr.NonEmptyReadonlyArray<Arr.NonEmptyReadonlyArray<DateString>> => {
  const firstDayOfWeek = options.firstDayOfWeek ?? 1
  const first = startOfWeek(startOfMonth(date), firstDayOfWeek)
  const last = endOfWeek(endOfMonth(date), firstDayOfWeek)
  const count = options.consistentWeeks === false ? (dayNumber(last) - dayNumber(first) + 1) / 7 : 6

  return Arr.makeBy(count, (index) => weekDays(addDays(first, index * 7), { ...options, firstDayOfWeek }))
}

export const layoutDays = <Days extends ReadonlyArray<DateString>>(
  events: ReadonlyArray<ScheduleEvent>,
  days: Days,
  shown: ReadonlyArray<DateString>,
  max: number
) => {
  const within = events.filter((event) => coverage(event, shown).covered)
  const placed = reserveRows(
    within.filter((event) => event.display !== "background"),
    days
  )

  return {
    days,
    segments: segmentsOf(compactRows(placed, days.length, max), days),
    background: within
      .filter((event) => event.display === "background")
      .map((event) => {
        const span = coverage(event, days)

        return {
          event,
          offset: (span.first / days.length) * 100,
          width: ((span.last - span.first + 1) / days.length) * 100
        }
      }),
    dayEvents: days.map((day, index) => {
      const dayEvents = placed
        .filter((entry) => entry.first <= index && entry.last >= index)
        .map((entry) => entry.event)

      return { date: day, events: dayEvents, hidden: Math.max(0, dayEvents.length - max) }
    })
  }
}

export const monthViewEvents = (
  input: MonthOptions & { readonly events: ReadonlyArray<ScheduleEvent>; readonly date: DateString }
): Arr.NonEmptyReadonlyArray<MonthWeek> => {
  const max = clampMaxEvents(input.maxEventsPerDay)
  const first = startOfMonth(input.date)
  const last = endOfMonth(input.date)
  const inMonth = (day: DateString) => input.withOutsideDays !== false || (day >= first && day <= last)
  const events = sortEvents(firstOfEach(input.events))

  return Arr.map(monthWeeks(input.date, input), (days) => layoutDays(events, days, days.filter(inMonth), max))
}

export const monthDaysOf = (date: DateString, options: MonthOptions = {}): Arr.NonEmptyReadonlyArray<DateString> => {
  const weekend = options.weekendDays ?? [0, 6]
  const all = Arr.makeBy(dayNumber(endOfMonth(date)) - dayNumber(startOfMonth(date)) + 1, (index) =>
    addDays(startOfMonth(date), index)
  )
  const workdays = all.filter((day) => !weekend.includes(dayOfWeek(day)))
  if (options.withWeekendDays !== false) return all

  return Arr.isReadonlyArrayNonEmpty(workdays) ? workdays : all
}

export const resourcesMonthEvents = (input: {
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly days: ReadonlyArray<DateString>
  readonly maxEventsPerDay?: number
}) => layoutDays(sortEvents(firstOfEach(input.events)), input.days, input.days, clampMaxEvents(input.maxEventsPerDay))
