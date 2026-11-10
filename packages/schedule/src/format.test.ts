import { describe, expect, it } from "@effect/vitest"
import { formatDateTime } from "./format.ts"
import { defaultScheduleLabels, scheduleLabels } from "./labels.ts"

describe("schedule formats and labels", () => {
  it("formats dates and times with dayjs-style tokens", () => {
    expect(formatDateTime("2025-01-15 09:05:07", "MMMM D, YYYY")).toBe("January 15, 2025")
    expect(formatDateTime("2025-01-15 09:05:07", "HH:mm:ss")).toBe("09:05:07")
    expect(formatDateTime("2025-01-15 13:05:00", "h:mm A")).toBe("1:05 PM")
    expect(formatDateTime("2025-01-15 00:05:00", "hh a H")).toBe("12 am 0")
    expect(formatDateTime("2025-01-15 09:05:00", "[Today at] HH:mm")).toBe("Today at 09:05")
    expect(formatDateTime("2025-01-15 09:05:00", (value) => `at ${value}`)).toBe("at 2025-01-15 09:05:00")
  })

  it("merges label overrides", () => {
    expect(scheduleLabels().today).toBe("Today")
    expect(scheduleLabels({ today: "Aujourd'hui" }).today).toBe("Aujourd'hui")
    expect(defaultScheduleLabels.moreLabel(3)).toBe("+3 more")
  })
})
