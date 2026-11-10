import type { ScheduleEvent, ScheduleResource, ScheduleResourceGroup } from "../../events.ts"

export const day = "2025-01-15"

export const rooms: ReadonlyArray<ScheduleResource> = [
  { id: "orion", label: "Orion" },
  { id: "lyra", label: "Lyra" },
  { id: 3, label: "Studio" },
  { id: "desk", label: "Hot desk" }
]

export const floors: ReadonlyArray<ScheduleResourceGroup> = [
  { label: "First floor", resourceIds: ["orion", "lyra"] },
  { label: "Basement", resourceIds: [3] }
]

export const roomEvents: ReadonlyArray<ScheduleEvent> = [
  {
    id: "kickoff",
    title: "Kickoff",
    start: `${day} 09:00:00`,
    end: `${day} 11:00:00`,
    color: "blue",
    resourceId: "orion"
  },
  { id: "sync", title: "Sync", start: `${day} 09:30:00`, end: `${day} 10:30:00`, color: "teal", resourceId: "orion" },
  {
    id: "review",
    title: "Review",
    start: `${day} 10:00:00`,
    end: `${day} 12:00:00`,
    color: "red",
    resourceId: "orion"
  },
  {
    id: "workshop",
    title: "Workshop",
    start: `${day} 13:00:00`,
    end: `${day} 15:00:00`,
    color: "grape",
    resourceId: "lyra"
  },
  { id: "podcast", title: "Podcast", start: `${day} 11:00:00`, end: `${day} 12:00:00`, color: "orange", resourceId: 3 },
  {
    id: "cleaning",
    title: "Cleaning",
    start: `${day} 12:00:00`,
    end: `${day} 13:00:00`,
    color: "gray",
    resourceId: "lyra",
    display: "background"
  },
  {
    id: "maintenance",
    title: "Maintenance",
    start: `${day} 00:00:00`,
    end: `${day} 23:59:59`,
    color: "gray",
    resourceId: 3,
    display: "background"
  },
  {
    id: "offsite",
    title: "Offsite",
    start: `${day} 00:00:00`,
    end: `${day} 23:59:59`,
    color: "lime",
    resourceId: "desk"
  }
]
