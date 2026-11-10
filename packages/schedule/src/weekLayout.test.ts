import { describe, expect, it } from "@effect/vitest"
import type { ScheduleEvent } from "./events.ts"
import { lastDayOf, weekDays, weekViewEvents } from "./weekLayout.ts"

const event = (id: string, start: string, end: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  title: id,
  start,
  end,
  color: "blue",
  ...extra
})

const events = [
  event("a", "2025-01-13 09:00:00", "2025-01-13 10:00:00"),
  event("b", "2025-01-13 09:30:00", "2025-01-13 10:30:00"),
  event("c", "2025-01-15 14:00:00", "2025-01-15 15:00:00"),
  event("trip", "2025-01-10 00:00:00", "2025-01-14 12:00:00"),
  event("conf", "2025-01-15 00:00:00", "2025-01-16 00:00:00"),
  event("holiday", "2025-01-15 00:00:00", "2025-01-15 23:59:59"),
  event("long", "2025-01-18 00:00:00", "2025-01-22 00:00:00"),
  event("huge", "2025-01-01 00:00:00", "2025-02-01 00:00:00"),
  event("lunch", "2025-01-14 12:00:00", "2025-01-14 13:00:00", { display: "background" }),
  event("closed", "2025-01-16 00:00:00", "2025-01-16 23:59:59", { display: "background" }),
  event("night", "2025-01-16 20:00:00", "2025-01-17 02:00:00", { display: "background" }),
  event("late", "2025-01-17 17:00:00", "2025-01-18 03:00:00", { display: "background" }),
  event("away", "2025-02-03 09:00:00", "2025-02-03 10:00:00"),
  event("a", "2025-01-14 09:00:00", "2025-01-14 10:00:00")
]

describe("week layout, as getWeekViewEvents", () => {
  it("lists the visible days", () => {
    expect(weekDays("2025-01-15")).toEqual([
      "2025-01-13",
      "2025-01-14",
      "2025-01-15",
      "2025-01-16",
      "2025-01-17",
      "2025-01-18",
      "2025-01-19"
    ])
    expect(weekDays("2025-01-15", { firstDayOfWeek: 0, withWeekendDays: false })).toEqual([
      "2025-01-13",
      "2025-01-14",
      "2025-01-15",
      "2025-01-16",
      "2025-01-17"
    ])
    expect(weekDays("2025-01-15", { withWeekendDays: false, weekendDays: [5, 6] })).toHaveLength(5)
    expect(weekDays("2025-01-15", { withWeekendDays: false, weekendDays: [0, 1, 2, 3, 4, 5, 6] })).toHaveLength(7)
    expect(lastDayOf(event("x", "2025-01-15 00:00:00", "2025-01-16 00:00:00"))).toBe("2025-01-15")
    expect(lastDayOf(event("y", "2025-01-15 00:00:00", "2025-01-15 00:00:00"))).toBe("2025-01-15")
  })

  it("lays out the week", () => {
    const week = weekViewEvents({
      events,
      date: "2025-01-15",
      startTime: "08:00:00",
      endTime: "18:00:00",
      intervalMinutes: 60
    })
    expect(week.allDayEvents.map((item) => [item.id, item.position])).toEqual([
      ["huge", { row: 0, rows: 3, offset: 0, width: 100, hanging: "both" }],
      ["trip", { row: 1, rows: 3, offset: 0, width: (2 / 7) * 100, hanging: "start" }],
      ["conf", { row: 1, rows: 3, offset: (2 / 7) * 100, width: (1 / 7) * 100, hanging: "none" }],
      ["holiday", { row: 2, rows: 3, offset: (2 / 7) * 100, width: (1 / 7) * 100, hanging: "none" }],
      ["long", { row: 1, rows: 3, offset: (5 / 7) * 100, width: (2 / 7) * 100, hanging: "end" }]
    ])
    const day = (date: string) => week.dayEvents.find((item) => item.date === date)
    expect(
      day("2025-01-13")?.regularEvents.map((item) => [item.id, item.position.column, item.position.width])
    ).toEqual([
      ["a", 0, 50],
      ["b", 1, 50]
    ])
    expect(
      day("2025-01-14")?.backgroundEvents.map((item) => [item.id, item.position.top, item.position.allDay])
    ).toEqual([["lunch", 40, false]])
    expect(day("2025-01-16")?.backgroundEvents.map((item) => [item.id, item.position.allDay])).toEqual([
      ["closed", true]
    ])
    expect(day("2025-01-17")?.backgroundEvents.map((item) => item.id)).toEqual(["late"])
    expect(day("2025-01-18")?.backgroundEvents).toEqual([])
    expect(
      weekViewEvents({ events, date: "2025-01-15", eventOverlapMode: "cascade" }).dayEvents[0]?.regularEvents.map(
        (item) => item.position.width
      )
    ).toEqual([100, 80])
    expect(weekViewEvents({ events: [], date: "2025-01-15" }).allDayEvents).toEqual([])
  })
})
