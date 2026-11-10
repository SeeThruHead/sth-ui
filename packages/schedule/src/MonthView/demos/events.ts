import type { ScheduleEvent } from "../../events.ts"

export const monthEvents: ReadonlyArray<ScheduleEvent> = [
  { id: "trip", title: "Conference trip", start: "2024-12-30 00:00:00", end: "2025-01-03 00:00:00", color: "grape" },
  {
    id: "standup",
    title: "Standup",
    start: "2025-01-06 09:00:00",
    end: "2025-01-06 09:30:00",
    color: "blue",
    recurrence: { rrule: "FREQ=WEEKLY;COUNT=4" }
  },
  { id: "review", title: "Design review", start: "2025-01-06 11:00:00", end: "2025-01-06 12:00:00", color: "teal" },
  { id: "lunch", title: "Team lunch", start: "2025-01-06 12:30:00", end: "2025-01-06 13:30:00", color: "orange" },
  { id: 4, title: "Release", start: "2025-01-15 10:00:00", end: "2025-01-15 11:00:00", color: "red" },
  { id: "sprint", title: "Sprint", start: "2025-01-13 00:00:00", end: "2025-01-25 00:00:00", color: "cyan" },
  {
    id: "closed",
    title: "Office closed",
    start: "2025-01-20 00:00:00",
    end: "2025-01-20 23:59:59",
    color: "gray",
    display: "background"
  }
]
