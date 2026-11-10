import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { ScheduleEvent, ScheduleResource, ScheduleResourceGroup } from "./events.ts"

describe("schedule data", () => {
  it("decodes events, resources and groups", () => {
    const event = {
      id: 1,
      title: "Standup",
      start: "2026-02-16 09:00:00",
      end: "2026-02-16 09:30:00",
      color: "blue",
      variant: "light" as const,
      recurrence: { rrule: "FREQ=DAILY", exdate: ["2026-02-17 09:00:00"] }
    }
    expect(Schema.decodeSync(ScheduleEvent)(event)).toEqual(event)
    expect(Schema.decodeSync(ScheduleResource)({ id: "room", label: "Room A" })).toEqual({
      id: "room",
      label: "Room A"
    })
    expect(Schema.decodeSync(ScheduleResourceGroup)({ label: "Floor", resourceIds: ["room"] }).resourceIds).toEqual([
      "room"
    ])
    const invalid: unknown = { ...event, variant: "outline" }
    expect(() => Schema.decodeUnknownSync(ScheduleEvent)(invalid)).toThrow()
  })
})
