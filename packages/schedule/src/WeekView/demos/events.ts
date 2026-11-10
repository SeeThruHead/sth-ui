import type { ScheduleEvent } from "../../events.ts"

export const weekEvents: ReadonlyArray<ScheduleEvent> = [
  { id: "offsite", title: "Team offsite", start: "2025-01-09 00:00:00", end: "2025-01-14 00:00:00", color: "grape" },
  { id: "launch", title: "Launch week", start: "2025-01-15 00:00:00", end: "2025-01-21 00:00:00", color: "orange" },
  { id: "holiday", title: "Holiday", start: "2025-01-17 00:00:00", end: "2025-01-17 23:59:59", color: "green" },
  {
    id: "standup",
    title: "Standup",
    start: "2025-01-13 09:00:00",
    end: "2025-01-13 09:30:00",
    color: "blue",
    recurrence: { rrule: "FREQ=DAILY;COUNT=5" }
  },
  { id: "planning", title: "Planning", start: "2025-01-13 10:00:00", end: "2025-01-13 12:00:00", color: "teal" },
  { id: "review", title: "Design review", start: "2025-01-13 11:00:00", end: "2025-01-13 12:30:00", color: "red" },
  { id: 9, title: "Interview", start: "2025-01-15 14:00:00", end: "2025-01-15 15:00:00", color: "cyan" },
  {
    id: "lunch",
    title: "Lunch",
    start: "2025-01-14 12:00:00",
    end: "2025-01-14 13:00:00",
    color: "gray",
    display: "background"
  },
  {
    id: "closed",
    title: "Office closed",
    start: "2025-01-18 00:00:00",
    end: "2025-01-18 23:59:59",
    color: "gray",
    display: "background"
  }
]
