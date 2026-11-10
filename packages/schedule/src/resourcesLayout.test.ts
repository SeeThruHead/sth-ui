import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import type { ScheduleEvent } from "./events.ts"
import { overflows, resourceRows, resourcesDayEvents } from "./resourcesLayout.ts"

const resources = [
  { id: "a", label: "Room A" },
  { id: "b", label: "Room B" },
  { id: "c", label: "Room C" },
  { id: 4, label: "Desk" }
]

const event = (id: string, resourceId: string | number | undefined, start: string, end: string): ScheduleEvent => ({
  id,
  title: id,
  start: `2025-01-15 ${start}`,
  end: `2025-01-15 ${end}`,
  color: "blue",
  ...(resourceId === undefined ? {} : { resourceId })
})

describe("resource rows, as getOrderedResources", () => {
  it("orders resources by group, then the rest", () => {
    expect(resourceRows(resources).map((row) => [row.resource.id, Option.isSome(row.group)])).toEqual([
      ["a", false],
      ["b", false],
      ["c", false],
      [4, false]
    ])
    const rows = resourceRows(resources, [
      { label: "Upstairs", resourceIds: ["c", "a", "a", "missing"] },
      { label: "Desks", resourceIds: [4] },
      { label: "Empty", resourceIds: ["a"] }
    ])
    expect(
      rows.map((row) => [
        row.resource.id,
        Option.map(row.group, (group) => [group.group.label, group.position, group.count])
      ])
    ).toEqual([
      ["c", Option.some(["Upstairs", "first", 2])],
      ["a", Option.some(["Upstairs", "last", 2])],
      [4, Option.some(["Desks", "only", 1])],
      ["b", Option.none()]
    ])
    expect(
      resourceRows(resources, [{ label: "Three", resourceIds: ["a", "b", "c"] }]).map((row) =>
        Option.map(row.group, (group) => group.position)
      )
    ).toEqual([Option.some("first"), Option.some("middle"), Option.some("last"), Option.none()])
  })
})

describe("resource day events, as getResourcesDayViewEvents", () => {
  it("lays out each resource's events and finds overflowing clusters", () => {
    const events = [
      event("x", "a", "09:00:00", "11:00:00"),
      event("y", "a", "09:30:00", "10:30:00"),
      event("z", "a", "10:00:00", "12:00:00"),
      event("w", "b", "14:00:00", "15:00:00"),
      event("loose", undefined, "09:00:00", "10:00:00")
    ]
    const days = resourcesDayEvents({
      rows: resourceRows(resources),
      events,
      date: "2025-01-15",
      startTime: "08:00:00",
      endTime: "18:00:00",
      intervalMinutes: 60
    })
    expect(days.map((day) => [day.resource.id, day.events.regularEvents.map((item) => item.id)])).toEqual([
      ["a", ["x", "y", "z"]],
      ["b", ["w"]],
      ["c", []],
      [4, []]
    ])
    const room = days[0]?.events.regularEvents ?? []
    expect(overflows(room, 2)).toEqual([{ start: 10, end: 40, hidden: 1, events: room }])
    expect(overflows(room, 3)).toEqual([])
  })
})
