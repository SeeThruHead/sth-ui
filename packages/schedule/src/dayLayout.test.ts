import { describe, expect, it } from "@effect/vitest"
import {
  clampIntervalMinutes,
  clampSlotLabelInterval,
  currentTimePosition,
  dayPosition,
  dayTimeIntervals,
  dayViewEvents,
  isAllDayEvent,
  isEventInTimeRange,
  isEventsOverlap,
  isMultidayEvent,
  nextDay,
  overlapClusters,
  positionDayEvents,
  timeSeconds,
  timeString
} from "./dayLayout.ts"
import type { ScheduleEvent } from "./events.ts"

const day = "2025-01-15"

const event = (id: number, start: string, end: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id,
  title: `Event ${id}`,
  start: start.includes("-") ? start : `${day} ${start}`,
  end: end.includes("-") ? end : `${day} ${end}`,
  color: "blue",
  ...extra
})

const byId = (
  events: ReadonlyArray<{ readonly id: string | number; readonly position: { readonly [key: string]: unknown } }>,
  id: number
) => events.find((item) => item.id === id)?.position

describe("day view layout, as @mantine/schedule's", () => {
  it("clamps slot intervals to divisors of an hour or whole hours", () => {
    expect(clampIntervalMinutes(15)).toBe(15)
    expect(clampIntervalMinutes(7)).toBe(60)
    expect(clampIntervalMinutes(120)).toBe(120)
    expect(clampIntervalMinutes(90)).toBe(60)
    expect(clampIntervalMinutes(0)).toBe(1)
    expect(clampSlotLabelInterval(60, 15)).toBe(60)
    expect(clampSlotLabelInterval(-1, 20)).toBe(60)
    expect(clampSlotLabelInterval(45, 30)).toBe(60)
    expect(clampSlotLabelInterval(Number.NaN, 7)).toBe(60)
    expect(clampSlotLabelInterval(30, 20)).toBe(60)
  })

  it("splits the day into slots with hour and label starts", () => {
    const slots = dayTimeIntervals({
      startTime: "08:00",
      endTime: "10:00",
      intervalMinutes: 30,
      labelIntervalMinutes: 60
    })
    expect(slots.map((slot) => [slot.startTime, slot.isHourStart, slot.isLabelStart])).toEqual([
      ["08:00:00", true, true],
      ["08:30:00", false, false],
      ["09:00:00", true, true],
      ["09:30:00", false, false]
    ])
    expect(dayTimeIntervals({ startTime: "00:00" })).toHaveLength(24)
    expect(
      dayTimeIntervals({ startTime: "08:20", endTime: "09:00", intervalMinutes: 30 }).map((slot) => [
        slot.endTime,
        slot.isLabelStart
      ])
    ).toEqual([
      ["08:50:00", true],
      ["09:00:00", false]
    ])
    expect(timeSeconds("01:02:03")).toBe(3723)
    expect(timeSeconds("")).toBe(0)
    expect(timeString(3723)).toBe("01:02:03")
  })

  it("tells overlaps, all-day, multi-day and time-range events apart", () => {
    expect(isEventsOverlap(event(1, "09:00", "10:00"), event(2, "09:30", "11:00"))).toBe(true)
    expect(isEventsOverlap(event(1, "09:00", "10:00"), event(2, "10:00", "11:00"))).toBe(false)
    expect(isEventsOverlap(event(1, "not-a-date", "10:00"), event(2, "10:00", "11:00"))).toBe(false)
    expect(isAllDayEvent(event(1, "00:00", "2025-01-16 00:00:00"), day)).toBe(true)
    expect(isAllDayEvent(event(1, "00:00", "23:59:59"), day)).toBe(true)
    expect(isAllDayEvent(event(1, "01:00", "23:59:59"), day)).toBe(false)
    expect(isAllDayEvent(event(1, "00:00", "22:00"), day)).toBe(false)
    expect(isMultidayEvent(event(1, "10:00", "2025-01-16 00:00:00"))).toBe(false)
    expect(isMultidayEvent(event(1, "10:00", "2025-01-16 09:00:00"))).toBe(true)
    expect(isEventInTimeRange(event(1, "07:00", "07:30"), "08:00", "18:00")).toBe(false)
    expect(isEventInTimeRange(event(1, "07:30", "08:30"), "08:00", "18:00")).toBe(true)
    expect(isEventInTimeRange(event(1, "18:00", "19:00"), "08:00", "18:00")).toBe(false)
    expect(isEventInTimeRange(event(1, "17:00", "2025-01-16 00:00:00"), "08:00", "18:00")).toBe(true)
    expect(isEventInTimeRange(event(1, "07:00", "07:30"))).toBe(true)
    expect(isEventInTimeRange(event(1, "00:00", "23:59:59"), "08:00", "18:00")).toBe(true)
    expect(isEventInTimeRange(event(1, "07:00", "2025-01-17 07:00:00"), "08:00", "18:00")).toBe(true)
  })

  it("places events vertically and finds the current time", () => {
    expect(dayPosition({ event: event(1, "06:00", "12:00") })).toEqual({ top: 25, height: 25 })
    expect(dayPosition({ event: event(1, "07:00", "09:00"), startTime: "08:00", endTime: "12:00" })).toEqual({
      top: 0,
      height: 25
    })
    expect(
      dayPosition({ event: event(1, "10:00", "13:00"), startTime: "08:00", endTime: "12:00", intervalMinutes: 60 })
    ).toEqual({
      top: 50,
      height: 50
    })
    expect(currentTimePosition({ now: `${day} 12:00:00` })).toBe(50)
    expect(currentTimePosition({ now: `${day} 10:00:00`, startTime: "08:00", endTime: "12:00" })).toBe(50)
    expect(
      currentTimePosition({ now: `${day} 10:00:00`, startTime: "08:00", endTime: "11:30", intervalMinutes: 60 })
    ).toBe(50)
  })

  it("groups overlapping events into clusters", () => {
    const clusters = overlapClusters([
      event(1, "09:00", "10:00"),
      event(2, "11:00", "12:00"),
      event(3, "09:30", "11:30")
    ])
    expect(clusters.map((cluster) => cluster.map((item) => item.id))).toEqual([[1, 2, 3]])
    expect(
      overlapClusters([event(1, "09:00", "10:00"), event(2, "11:00", "12:00")]).map((cluster) => cluster.length)
    ).toEqual([1, 1])
  })

  it("splits overlapping events into columns and fills free columns", () => {
    expect(positionDayEvents({ date: day, events: [] })).toEqual([])
    const single = positionDayEvents({ date: day, events: [event(1, "10:00", "12:00")] })
    expect(byId(single, 1)).toMatchObject({ allDay: false, column: 0, overlaps: 1, width: 100, offset: 0 })
    const pair = positionDayEvents({ date: day, events: [event(1, "10:00", "12:00"), event(2, "10:30", "12:00")] })
    expect(byId(pair, 1)).toMatchObject({ offset: 0, width: 50 })
    expect(byId(pair, 2)).toMatchObject({ offset: 50, width: 50 })
    const spread = positionDayEvents({
      date: day,
      events: [
        event(1, "09:00", "09:30"),
        event(2, "09:00", "12:00"),
        event(3, "09:30", "12:30"),
        event(9, "10:30", "11:30")
      ]
    })
    expect(byId(spread, 2)).toMatchObject({ column: 0, overlaps: 3, offset: 0 })
    expect(byId(spread, 1)?.["width"]).toBeCloseTo(200 / 3, 2)
    expect(byId(spread, 3)?.["width"]).toBeCloseTo(100 / 3, 2)
    expect(byId(spread, 9)).toMatchObject({ column: 2 })
    const reused = positionDayEvents({ date: day, events: [event(1, "09:00", "10:00"), event(2, "10:00", "11:00")] })
    expect(reused.map((item) => item.position.column)).toEqual([0, 0])
  })

  it("cascades overlapping events and keeps all-day events full width", () => {
    const cascaded = positionDayEvents({
      date: day,
      eventOverlapMode: "cascade",
      events: [
        event(1, "00:00", "23:59:59"),
        event(2, "10:00", "12:00"),
        event(3, "10:30", "12:00"),
        event(4, "11:00", "12:00"),
        event(5, "14:00", "15:00")
      ]
    })
    expect(byId(cascaded, 1)).toMatchObject({ allDay: true, offset: 0, width: 100, overlaps: 1 })
    expect(byId(cascaded, 3)).toMatchObject({ offset: 20, width: 80, overlaps: 3 })
    expect(byId(cascaded, 4)).toMatchObject({ offset: 40, width: 60 })
    expect(byId(cascaded, 5)).toMatchObject({ offset: 0, width: 100, overlaps: 1 })
    const dense = positionDayEvents({
      date: day,
      eventOverlapMode: "cascade",
      events: Array.from({ length: 8 }, (_, index) => event(index + 1, "10:00", "12:00"))
    })
    expect(byId(dense, 8)?.["offset"]).toBeCloseTo(40, 5)
    const multiday = positionDayEvents({
      date: day,
      events: [event(1, "00:00", "2025-01-17 10:00:00"), event(2, "10:00", "11:00")]
    })
    expect(byId(multiday, 1)).toMatchObject({ allDay: true, top: 0, height: 100 })
  })

  it("collects a day's events into all-day, timed and background groups", () => {
    const result = dayViewEvents({
      date: day,
      startTime: "08:00",
      endTime: "18:00",
      intervalMinutes: 30,
      events: [
        event(1, "00:00", "23:59:59"),
        event(2, "10:00", "11:00"),
        event(2, "12:00", "13:00"),
        event(3, "06:00", "07:00"),
        event(4, "2025-01-14 20:00:00", "2025-01-16 08:00:00", { display: "background" }),
        event(5, "12:00", "14:00", { display: "background" }),
        event(6, "06:00", "07:00", { display: "background" }),
        event(7, "2025-01-14 10:00:00", "2025-01-14 12:00:00", { display: "background" }),
        event(8, "2025-01-16 10:00:00", "2025-01-16 12:00:00")
      ]
    })
    expect(result.allDayEvents.map((item) => item.id)).toEqual([1])
    expect(result.regularEvents.map((item) => item.id)).toEqual([2])
    expect(result.backgroundAllDayEvents.map((item) => item.id)).toEqual([4])
    expect(result.backgroundTimedEvents.map((item) => [item.id, item.position.top])).toEqual([[5, 40]])
    expect(nextDay(day)).toBe("2025-01-16")
  })
})
