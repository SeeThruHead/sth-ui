import { Option } from "effect"
import { RRule } from "rrule"
import {
  compareDateTime,
  fromUtcDate,
  isValidDateTime,
  normalizeDateTime,
  overlapsRange,
  toSeconds,
  toUtcDate,
  utcDate
} from "./datetime.ts"
import type { DateTimeString } from "./datetime.ts"
import type { EventId, Recurrence, ScheduleEvent } from "./events.ts"

export const defaultExpansionLimit = 2000

const keyOf = (recurringEventId: EventId, recurrenceId: string) => `${recurringEventId}::${recurrenceId}`

const exdates = (recurrence: Recurrence) =>
  new Set((recurrence.exdate ?? []).filter(isValidDateTime).map(normalizeDateTime))

const ruleString = (rule: string) => {
  const trimmed = rule.trim()
  const line = trimmed
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith("RRULE:"))

  return (line ?? trimmed).replace(/^RRULE:/, "")
}

const occurrences = (
  rrule: string,
  dtstart: DateTimeString,
  rangeStart: DateTimeString,
  rangeEnd: DateTimeString,
  durationSeconds: number,
  limit: number
): ReadonlyArray<Date> =>
  Option.getOrElse(
    Option.liftThrowable(() => {
      const options = RRule.parseString(ruleString(rrule))
      const rule = new RRule({ ...options, dtstart: toUtcDate(dtstart) })
      const searchStart = utcDate(toUtcDate(rangeStart).getTime() - Math.max(0, durationSeconds) * 1000)

      return rule.between(searchStart, toUtcDate(rangeEnd), true).slice(0, limit)
    })(),
    () => []
  )

const inRange = (event: ScheduleEvent, rangeStart: DateTimeString, rangeEnd: DateTimeString) => {
  if (!isValidDateTime(event.start) || !isValidDateTime(event.end)) return false

  return overlapsRange(event.start, event.end, rangeStart, rangeEnd)
}

const isOverride = (event: ScheduleEvent) => event.recurringEventId !== undefined && event.recurrenceId !== undefined

const generated = (event: ScheduleEvent, start: DateTimeString, end: DateTimeString): ScheduleEvent => {
  const { recurrence: _recurrence, ...rest } = event

  return {
    ...rest,
    id: `${event.id}::${start}`,
    start,
    end,
    recurringEventId: event.id,
    recurrenceId: start,
    recurringInstance: {
      isRecurringInstance: true,
      recurringEventId: event.id,
      recurrenceId: start,
      originalStart: start,
      originalEnd: end
    }
  }
}

type Expansion = { readonly events: ReadonlyArray<ScheduleEvent>; readonly consumed: ReadonlyArray<EventId> }

const expandSeries = (
  event: ScheduleEvent,
  recurrence: Recurrence,
  overrides: ReadonlyMap<string, ScheduleEvent>,
  rangeStart: DateTimeString,
  rangeEnd: DateTimeString,
  limit: number
): Expansion => {
  const dtstart = recurrence.dtstart ?? event.start
  const duration = Option.getOrElse(
    Option.zipWith(toSeconds(event.start), toSeconds(event.end), (start, end) => end - start),
    () => -1
  )
  if (!isValidDateTime(dtstart) || duration < 0) return { events: [], consumed: [] }
  const skipped = exdates(recurrence)

  return occurrences(recurrence.rrule, dtstart, rangeStart, rangeEnd, duration, limit)
    .map(fromUtcDate)
    .filter((start) => !skipped.has(start))
    .reduce<Expansion>(
      (state, start) =>
        Option.match(Option.fromNullishOr(overrides.get(keyOf(event.id, start))), {
          onNone: () => {
            const instance = generated(event, start, fromUtcDate(utcDate(toUtcDate(start).getTime() + duration * 1000)))

            return { ...state, events: [...state.events, instance] }
          },
          onSome: (override) =>
            inRange(override, rangeStart, rangeEnd)
              ? { events: [...state.events, override], consumed: [...state.consumed, override.id] }
              : state
        }),
      { events: [], consumed: [] }
    )
}

export const expandRecurringEvents = (input: {
  readonly events: ReadonlyArray<ScheduleEvent> | undefined
  readonly rangeStart: DateTimeString
  readonly rangeEnd: DateTimeString
  readonly expansionLimit?: number
}): ReadonlyArray<ScheduleEvent> => {
  const events = input.events ?? []
  const { rangeStart, rangeEnd } = input
  if (events.length === 0 || !isValidDateTime(rangeStart) || !isValidDateTime(rangeEnd)) return []
  const overrides = new Map(
    events.flatMap((event) =>
      event.recurringEventId === undefined || event.recurrenceId === undefined
        ? []
        : [[keyOf(event.recurringEventId, event.recurrenceId), event] as const]
    )
  )
  const regular = events.filter((event) => !isOverride(event) && event.recurrence === undefined)
  const series = events.flatMap((event) =>
    !isOverride(event) && event.recurrence !== undefined
      ? [
          expandSeries(
            event,
            event.recurrence,
            overrides,
            rangeStart,
            rangeEnd,
            input.expansionLimit ?? defaultExpansionLimit
          )
        ]
      : []
  )
  const consumed = new Set(series.flatMap((expansion) => expansion.consumed))
  const loose = [...overrides.values()].filter((override) => !consumed.has(override.id))

  return [
    ...regular.filter((event) => inRange(event, rangeStart, rangeEnd)),
    ...series.flatMap((expansion) => expansion.events),
    ...loose.filter((event) => inRange(event, rangeStart, rangeEnd))
  ]
}

export const sortEvents = (events: ReadonlyArray<ScheduleEvent>): ReadonlyArray<ScheduleEvent> =>
  events.toSorted((a, b) => compareDateTime(a.start, b.start) || compareDateTime(b.end, a.end))
