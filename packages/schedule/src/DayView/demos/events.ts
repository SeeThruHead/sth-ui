import type { ScheduleEvent } from "../../events.ts"

export const day = "2025-01-15"

export const dayEvents: ReadonlyArray<ScheduleEvent> = [
  {
    id: "conference",
    title: "Design conference",
    start: `${day} 00:00:00`,
    end: "2025-01-16 00:00:00",
    color: "grape"
  },
  { id: "holiday", title: "Office holiday", start: `${day} 00:00:00`, end: `${day} 23:59:59`, color: "green" },
  { id: "deadline", title: "Release deadline", start: `${day} 00:00:00`, end: `${day} 23:59:59`, color: "red" },
  {
    id: "standup",
    title: "Standup",
    start: "2025-01-13 09:00:00",
    end: "2025-01-13 09:30:00",
    color: "blue",
    recurrence: { rrule: "FREQ=DAILY;COUNT=10" }
  },
  { id: "review", title: "Design review", start: `${day} 09:00:00`, end: `${day} 11:00:00`, color: "teal" },
  {
    id: "pairing",
    title: "Pairing session",
    start: `${day} 10:00:00`,
    end: `${day} 12:00:00`,
    color: "orange",
    variant: "filled"
  },
  {
    id: "lunch",
    title: "Lunch",
    start: `${day} 12:00:00`,
    end: `${day} 13:00:00`,
    color: "gray",
    display: "background"
  },
  { id: "retro", title: "Retrospective", start: `${day} 15:00:00`, end: `${day} 16:30:00`, color: "red" }
]
