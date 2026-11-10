import { addDays, dayNumber } from "@sth-ui/dates/date/date.ts"
import type { DateString } from "@sth-ui/dates/date/date.ts"
import { isMultidayEvent } from "../dayLayout.ts"
import { dateOf, timeOf } from "../datetime.ts"
import type { ScheduleEvent } from "../events.ts"
import { sortEvents } from "../recurrence.ts"

export type AgendaGroup = { readonly date: DateString; readonly events: ReadonlyArray<ScheduleEvent> }

const lastDay = (event: ScheduleEvent): DateString =>
  timeOf(event.end).startsWith("00:00") ? addDays(dateOf(event.end), -1) : dateOf(event.end)

const daysOf = (event: ScheduleEvent, rangeStart: DateString, rangeEnd: DateString): ReadonlyArray<DateString> => {
  if (!isMultidayEvent(event)) return [dateOf(event.start)]
  const first = Math.max(dayNumber(dateOf(event.start)), dayNumber(rangeStart))
  const last = Math.min(dayNumber(lastDay(event)), dayNumber(rangeEnd))

  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) =>
    addDays(rangeStart, first - dayNumber(rangeStart) + offset)
  )
}

const inRange = (event: ScheduleEvent, rangeStart: DateString, rangeEnd: DateString) =>
  dateOf(event.end) >= rangeStart && dateOf(event.start) <= rangeEnd

const uniqueById = (events: ReadonlyArray<ScheduleEvent>) =>
  events.filter((event, index) => events.findIndex((other) => other.id === event.id) === index)

export const agendaGroups = (
  events: ReadonlyArray<ScheduleEvent>,
  rangeStart: DateString,
  rangeEnd: DateString
): ReadonlyArray<AgendaGroup> => {
  const shown = uniqueById(
    events.filter((event) => event.display !== "background" && inRange(event, rangeStart, rangeEnd))
  )
  const placed = shown.flatMap((event) => daysOf(event, rangeStart, rangeEnd).map((date) => ({ date, event })))
  const dates = [...new Set(placed.map((entry) => entry.date))].toSorted()

  return dates.map((date) => ({
    date,
    events: sortEvents(placed.filter((entry) => entry.date === date).map((entry) => entry.event))
  }))
}
