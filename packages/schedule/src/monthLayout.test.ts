import { describe, expect, it } from "@effect/vitest"
import type { ScheduleEvent } from "./events.ts"
import { clampMaxEvents, monthDaysOf, monthViewEvents, monthWeeks, resourcesMonthEvents } from "./monthLayout.ts"

const event = (id: string, start: string, end: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  title: id,
  start,
  end,
  color: "blue",
  ...extra
})

const events = [
  event("trip", "2024-12-30 00:00:00", "2025-01-08 00:00:00"),
  event("a", "2025-01-06 09:00:00", "2025-01-06 10:00:00"),
  event("b", "2025-01-06 11:00:00", "2025-01-06 12:00:00"),
  event("c", "2025-01-07 09:00:00", "2025-01-07 10:00:00"),
  event("d", "2025-01-08 09:00:00", "2025-01-08 10:00:00"),
  event("closed", "2025-01-09 00:00:00", "2025-01-09 23:59:59", { display: "background" }),
  event("late", "2025-02-20 09:00:00", "2025-02-20 10:00:00"),
  event("a", "2025-01-20 09:00:00", "2025-01-20 10:00:00")
]

describe("month layout, as getMonthViewEvents", () => {
  it("lists the weeks shown", () => {
    expect(monthWeeks("2025-01-15")).toHaveLength(6)
    expect(monthWeeks("2025-01-15", { consistentWeeks: false })).toHaveLength(5)
    expect(monthWeeks("2025-01-15", { withWeekendDays: false })[0]).toEqual([
      "2024-12-30",
      "2024-12-31",
      "2025-01-01",
      "2025-01-02",
      "2025-01-03"
    ])
    expect(
      monthWeeks("2025-01-15", { withWeekendDays: false, weekendDays: [5, 6], firstDayOfWeek: 0 })[0]
    ).toHaveLength(5)
    expect([clampMaxEvents(undefined), clampMaxEvents(0), clampMaxEvents(40), clampMaxEvents(3)]).toEqual([2, 1, 10, 3])
  })

  it("places events in rows, hiding what does not fit", () => {
    const weeks = monthViewEvents({ events, date: "2025-01-15" })
    const second = weeks[1]
    expect(second?.days[0]).toBe("2025-01-06")
    expect(
      second?.segments.map((item) => [
        item.event.id,
        item.row,
        item.offset,
        item.width,
        item.hanging,
        item.clipStart,
        item.clipEnd
      ])
    ).toEqual([
      ["trip", 0, 0, (2 / 7) * 100, "start", false, false],
      ["a", 1, 0, (1 / 7) * 100, "none", false, false],
      ["c", 1, (1 / 7) * 100, (1 / 7) * 100, "none", false, false],
      ["d", 0, (2 / 7) * 100, (1 / 7) * 100, "none", false, false]
    ])
    expect(second?.dayEvents.map((day) => [day.date, day.hidden])).toEqual([
      ["2025-01-06", 1],
      ["2025-01-07", 0],
      ["2025-01-08", 0],
      ["2025-01-09", 0],
      ["2025-01-10", 0],
      ["2025-01-11", 0],
      ["2025-01-12", 0]
    ])
    expect(second?.background.map((item) => [item.event.id, item.offset])).toEqual([["closed", (3 / 7) * 100]])
    expect(weeks[0]?.segments.map((item) => [item.event.id, item.hanging])).toEqual([["trip", "end"]])
    expect(weeks[3]?.segments).toEqual([])
  })

  it("splits an event into clipped segments when a day overflows", () => {
    const busy = [
      event("long", "2025-01-06 00:00:00", "2025-01-09 00:00:00"),
      event("x", "2025-01-06 09:00:00", "2025-01-06 10:00:00"),
      event("y", "2025-01-07 09:00:00", "2025-01-07 10:00:00"),
      event("z", "2025-01-07 11:00:00", "2025-01-07 12:00:00"),
      event("w", "2025-01-07 13:00:00", "2025-01-07 14:00:00"),
      event("v", "2025-01-08 09:00:00", "2025-01-08 10:00:00")
    ]
    const week = monthViewEvents({ events: busy, date: "2025-01-15", maxEventsPerDay: 1 })[1]
    expect(week?.segments.map((item) => [item.event.id, item.row, item.clipStart, item.clipEnd])).toEqual([
      ["long", 0, false, false]
    ])
    const two = monthViewEvents({ events: busy, date: "2025-01-15", maxEventsPerDay: 2 })[1]
    expect(two?.segments.map((item) => [item.event.id, item.row, item.clipStart, item.clipEnd])).toEqual([
      ["long", 0, false, false],
      ["x", 1, false, false],
      ["y", 1, false, false],
      ["v", 1, false, false]
    ])
  })

  it("moves an event that was hidden into a free row when it shows again", () => {
    const overlapping = [
      event("a", "2025-01-06 00:00:00", "2025-01-09 00:00:00"),
      event("b", "2025-01-06 00:00:00", "2025-01-07 00:00:00"),
      event("c", "2025-01-06 09:00:00", "2025-01-09 00:00:00")
    ]
    const week = monthViewEvents({ events: overlapping, date: "2025-01-15" })[1]
    expect(week?.segments.map((item) => [item.event.id, item.row, item.width, item.clipStart, item.clipEnd])).toEqual([
      ["a", 0, (3 / 7) * 100, false, false],
      ["b", 1, (1 / 7) * 100, false, false],
      ["c", 1, (2 / 7) * 100, true, false]
    ])
  })

  it("leaves out days of other months when asked", () => {
    const weeks = monthViewEvents({ events, date: "2025-01-15", withOutsideDays: false, consistentWeeks: false })
    expect(weeks[0]?.days).toHaveLength(7)
    expect(weeks[0]?.segments.map((item) => [item.event.id, item.hanging])).toEqual([["trip", "end"]])
    const february = [event("feb", "2025-02-03 09:00:00", "2025-02-03 10:00:00")]
    expect(monthViewEvents({ events: february, date: "2025-01-15", withOutsideDays: false })[5]?.segments).toEqual([])
    expect(monthViewEvents({ events: february, date: "2025-01-15" })[5]?.segments).toHaveLength(1)
    const huge = [event("huge", "2024-12-01 00:00:00", "2025-03-01 00:00:00")]
    expect(monthViewEvents({ events: huge, date: "2025-01-15" })[2]?.segments[0]?.hanging).toBe("both")
  })

  it("lists a month's days and lays a resource's events across them", () => {
    expect(monthDaysOf("2025-02-10")).toHaveLength(28)
    expect(monthDaysOf("2025-02-10", { withWeekendDays: false })).toHaveLength(20)
    expect(monthDaysOf("2025-02-10", { withWeekendDays: false, weekendDays: [0, 1, 2, 3, 4, 5, 6] })).toHaveLength(28)
    const days = monthDaysOf("2025-01-15")
    const row = resourcesMonthEvents({ events, days, maxEventsPerDay: 1 })
    expect(row.segments.map((item) => [item.event.id, item.offset, item.hanging])).toEqual([
      ["trip", 0, "start"],
      ["d", (7 / 31) * 100, "none"]
    ])
    expect(row.dayEvents[5]).toMatchObject({ date: "2025-01-06", hidden: 2 })
  })
})
