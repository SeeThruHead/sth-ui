import { describe, expect, it } from "@effect/vitest"
import { businessHoursState } from "./businessHours.ts"

const hours = ["09:00:00", "17:00:00"] as const

describe("business hours, as getBusinessHoursMod", () => {
  it("marks slots inside, outside or across business hours", () => {
    expect(businessHoursState({ start: "12:00", end: "13:00", businessHours: hours, highlight: false })).toEqual({
      _tag: "None"
    })
    expect(businessHoursState({ start: "09:00", end: "10:00", businessHours: hours, highlight: true })).toEqual({
      _tag: "Business"
    })
    expect(businessHoursState({ start: "17:00", end: "18:00", businessHours: hours, highlight: true })).toEqual({
      _tag: "NonBusiness"
    })
    expect(businessHoursState({ start: "07:00", end: "08:00", businessHours: hours, highlight: true })).toEqual({
      _tag: "NonBusiness"
    })
    expect(businessHoursState({ start: "08:30", end: "09:30", businessHours: hours, highlight: true })).toEqual({
      _tag: "Partial",
      from: 50,
      to: 100
    })
    expect(businessHoursState({ start: "16:00", end: "18:00", businessHours: hours, highlight: true })).toEqual({
      _tag: "Partial",
      from: 0,
      to: 50
    })
  })
})
