import { describe, expect, it } from "@effect/vitest"
import type { ScheduleEvent } from "./events.ts"
import { expandRecurringEvents, sortEvents } from "./recurrence.ts"

const series: ScheduleEvent = {
  id: "series-1",
  title: "Standup",
  start: "2026-02-16 09:00:00",
  end: "2026-02-16 09:30:00",
  color: "blue",
  recurrence: { rrule: "FREQ=DAILY;COUNT=5" }
}

const range = { rangeStart: "2026-02-16 00:00:00", rangeEnd: "2026-02-18 23:59:59" }

describe("recurring events, as @mantine/schedule's expandRecurringEvents", () => {
  it("expands occurrences in the visible range", () => {
    const result = expandRecurringEvents({
      events: [series],
      rangeStart: "2026-02-17 00:00:00",
      rangeEnd: "2026-02-18 23:59:59"
    })
    expect(result.map((event) => event.start)).toEqual(["2026-02-17 09:00:00", "2026-02-18 09:00:00"])
    expect(result[0]).toMatchObject({
      id: "series-1::2026-02-17 09:00:00",
      end: "2026-02-17 09:30:00",
      recurringEventId: "series-1",
      recurringInstance: { isRecurringInstance: true, originalStart: "2026-02-17 09:00:00" }
    })
    expect(result[0]).not.toHaveProperty("recurrence")
  })

  it("skips excluded dates and limits the expansion", () => {
    const result = expandRecurringEvents({
      events: [{ ...series, recurrence: { rrule: "FREQ=DAILY;COUNT=3", exdate: ["2026-02-17 09:00", "bad"] } }],
      ...range
    })
    expect(result.map((event) => event.start)).toEqual(["2026-02-16 09:00:00", "2026-02-18 09:00:00"])
    expect(expandRecurringEvents({ events: [series], ...range, expansionLimit: 1 })).toHaveLength(1)
  })

  it("replaces an occurrence with its override and keeps loose overrides", () => {
    const moved: ScheduleEvent = {
      id: "override-1",
      title: "Moved standup",
      start: "2026-02-17 12:00:00",
      end: "2026-02-17 12:30:00",
      color: "red",
      recurringEventId: "series-1",
      recurrenceId: "2026-02-17 09:00:00"
    }
    const result = expandRecurringEvents({ events: [series, moved], ...range })
    expect(result.map((event) => event.id)).toEqual([
      "series-1::2026-02-16 09:00:00",
      "override-1",
      "series-1::2026-02-18 09:00:00"
    ])
    const away = { ...moved, start: "2026-03-01 12:00:00", end: "2026-03-01 12:30:00" }
    expect(expandRecurringEvents({ events: [series, away], ...range }).map((event) => event.id)).not.toContain(
      "override-1"
    )
    const loose = { ...moved, id: "loose", recurringEventId: "gone" }
    expect(expandRecurringEvents({ events: [loose], ...range }).map((event) => event.id)).toEqual(["loose"])
    expect(
      expandRecurringEvents({
        events: [{ ...loose, start: "2026-04-01 00:00:00", end: "2026-04-01 01:00:00" }],
        ...range
      })
    ).toEqual([])
  })

  it("keeps one-off events and drops ones outside the range or invalid", () => {
    const oneOff = {
      id: "one",
      title: "One off",
      start: "2026-02-17 10:00:00",
      end: "2026-02-17 11:00:00",
      color: "grape"
    }
    expect(expandRecurringEvents({ events: [oneOff], ...range })).toEqual([oneOff])
    expect(expandRecurringEvents({ events: [{ ...oneOff, start: "nope" }], ...range })).toEqual([])
    expect(expandRecurringEvents({ events: [{ ...oneOff, end: "nope" }], ...range })).toEqual([])
    expect(expandRecurringEvents({ events: undefined, ...range })).toEqual([])
    expect(expandRecurringEvents({ events: [series], rangeStart: "invalid", rangeEnd: range.rangeEnd })).toEqual([])
    expect(expandRecurringEvents({ events: [series], rangeStart: range.rangeStart, rangeEnd: "invalid" })).toEqual([])
  })

  it("reads RRULE prefixes, full iCalendar text, dtstart and weekly rules", () => {
    expect(
      expandRecurringEvents({ events: [{ ...series, recurrence: { rrule: "RRULE:FREQ=DAILY;COUNT=3" } }], ...range })
    ).toHaveLength(3)
    expect(
      expandRecurringEvents({
        events: [{ ...series, recurrence: { rrule: "DTSTART:20260216T090000Z\nRRULE:FREQ=DAILY;COUNT=2" } }],
        ...range
      })
    ).toHaveLength(2)
    expect(
      expandRecurringEvents({
        events: [{ ...series, recurrence: { rrule: "FREQ=DAILY;COUNT=2", dtstart: "2026-02-17 09:00:00" } }],
        ...range
      }).map((event) => event.start)
    ).toEqual(["2026-02-17 09:00:00", "2026-02-18 09:00:00"])
    const weekly = {
      ...series,
      start: "2026-02-16 10:00:00",
      end: "2026-02-16 11:00:00",
      recurrence: { rrule: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4" }
    }
    expect(
      expandRecurringEvents({
        events: [weekly],
        rangeStart: "2026-02-16 00:00:00",
        rangeEnd: "2026-02-28 23:59:59"
      }).map((event) => event.start)
    ).toEqual(["2026-02-16 10:00:00", "2026-02-18 10:00:00", "2026-02-23 10:00:00", "2026-02-25 10:00:00"])
  })

  it("ignores broken series", () => {
    expect(expandRecurringEvents({ events: [{ ...series, recurrence: { rrule: "NOT A RULE" } }], ...range })).toEqual(
      []
    )
    expect(expandRecurringEvents({ events: [{ ...series, end: "2026-02-16 08:00:00" }], ...range })).toEqual([])
    expect(expandRecurringEvents({ events: [{ ...series, end: "nope" }], ...range })).toEqual([])
    expect(
      expandRecurringEvents({ events: [{ ...series, recurrence: { rrule: "FREQ=DAILY", dtstart: "bad" } }], ...range })
    ).toEqual([])
  })

  it("sorts events by start, longer first", () => {
    const short = { ...series, id: "a", end: "2026-02-16 09:10:00" }
    const early = { ...series, id: "b", start: "2026-02-16 08:00:00" }
    expect(sortEvents([short, series, early]).map((event) => event.id)).toEqual(["b", "series-1", "a"])
  })
})
