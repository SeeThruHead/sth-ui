import { describe, expect, it } from "@effect/vitest"
import type { ScheduleEvent } from "../events.ts"
import { agendaGroups } from "./agenda.ts"

const event = (id: string, start: string, end: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  title: id,
  start,
  end,
  color: "blue",
  ...extra
})

describe("agenda grouping, as getAgendaViewEvents", () => {
  it("groups events by day, repeating multi-day events on each day in range", () => {
    const late = event("late", "2025-01-15 15:00:00", "2025-01-15 16:00:00")
    const early = event("early", "2025-01-15 09:00:00", "2025-01-15 10:00:00")
    const trip = event("trip", "2025-01-13 00:00:00", "2025-01-17 00:00:00")
    const longer = event("longer", "2025-01-16 10:00:00", "2025-01-18 12:00:00")
    const groups = agendaGroups(
      [
        late,
        early,
        trip,
        longer,
        event("bg", "2025-01-15 12:00:00", "2025-01-15 13:00:00", { display: "background" }),
        event("before", "2025-01-01 09:00:00", "2025-01-01 10:00:00"),
        event("after", "2025-02-01 09:00:00", "2025-02-01 10:00:00"),
        event("late", "2025-01-16 09:00:00", "2025-01-16 10:00:00")
      ],
      "2025-01-14",
      "2025-01-17"
    )
    expect(groups.map((group) => [group.date, group.events.map((item) => item.id)])).toEqual([
      ["2025-01-14", ["trip"]],
      ["2025-01-15", ["trip", "early", "late"]],
      ["2025-01-16", ["trip", "longer"]],
      ["2025-01-17", ["longer"]]
    ])
    expect(agendaGroups([], "2025-01-14", "2025-01-17")).toEqual([])
  })
})
