import { describe, expect, it } from "@effect/vitest"
import type { ScheduleEvent } from "./events.ts"
import { eventPlacementConflicts, validatePlacement } from "./placement.ts"

const event = (id: string, start: string, end: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  title: id,
  start: `2025-01-15 ${start}`,
  end: `2025-01-15 ${end}`,
  color: "blue",
  ...extra
})

const moving = event("moving", "09:00:00", "10:00:00")
const busy = event("busy", "09:30:00", "10:30:00", { resourceId: "a" })
const lunch = event("lunch", "09:00:00", "10:00:00", { display: "background" })
const allDay = event("all", "00:00:00", "23:59:59")
const nextDay: ScheduleEvent = { ...event("whole", "00:00:00", "00:00:00"), end: "2025-01-16 00:00:00" }
const sibling = event("s2", "09:00:00", "10:00:00", { recurringEventId: "series", recurrenceId: "r2" })
const occurrence = event("s1", "09:00:00", "10:00:00", {
  recurringInstance: {
    isRecurringInstance: true,
    recurringEventId: "series",
    recurrenceId: "r1",
    originalStart: "",
    originalEnd: ""
  }
})
const same = event("s3", "09:00:00", "10:00:00", { recurringEventId: "series", recurrenceId: "r1" })
const other = event("o", "09:00:00", "10:00:00", { recurringEventId: "other", recurrenceId: "r1" })
const noOccurrence = event("n", "09:00:00", "10:00:00", { recurringEventId: "series" })
const events = [moving, busy, lunch, allDay, nextDay]

const place = (start: string, end: string, extra = {}) => ({
  event: moving,
  start: `2025-01-15 ${start}`,
  end: `2025-01-15 ${end}`,
  events,
  preventEventOverlap: true,
  ...extra
})

describe("event placement, as isEventPlacementAllowed", () => {
  it("allows anything unless overlap is prevented", () => {
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00", { preventEventOverlap: undefined }))).toEqual([])
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00", { preventEventOverlap: false }))).toEqual([])
  })

  it("finds timed conflicts, skipping itself, background and all-day events", () => {
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00"))).toEqual([busy])
    expect(eventPlacementConflicts(place("11:00:00", "12:00:00"))).toEqual([])
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00", { resourceId: "b" }))).toEqual([])
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00", { resourceId: "a" }))).toEqual([busy])
    expect(eventPlacementConflicts(place("00:00:00", "23:59:59"))).toEqual([allDay, nextDay])
    expect(eventPlacementConflicts(place("09:00:00", "10:00:00", { preventEventOverlap: () => false }))).toEqual([])
  })

  it("treats occurrences of one series as the same event", () => {
    const series = [sibling, same, other, noOccurrence]
    expect(eventPlacementConflicts({ ...place("09:00:00", "10:00:00"), event: occurrence, events: series })).toEqual([
      sibling,
      other,
      noOccurrence
    ])
    expect(
      eventPlacementConflicts({ ...place("09:00:00", "10:00:00"), event: noOccurrence, events: [sibling] })
    ).toEqual([sibling])
  })

  it("validates a placement with an overlap or a caller's rule", () => {
    expect(validatePlacement(place("09:00:00", "10:00:00"))).toEqual({
      valid: false,
      conflicts: [busy],
      reason: "overlap"
    })
    expect(validatePlacement({ ...place("11:00:00", "12:00:00"), allow: () => false })).toEqual({
      valid: false,
      conflicts: [],
      reason: "rejected"
    })
    expect(validatePlacement({ ...place("11:00:00", "12:00:00"), allow: () => true })).toEqual({
      valid: true,
      conflicts: [],
      reason: null
    })
    expect(validatePlacement(place("11:00:00", "12:00:00"))).toEqual({ valid: true, conflicts: [], reason: null })
  })
})
