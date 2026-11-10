import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import type { ScheduleEvent } from "../events.ts"
import {
  dropRange,
  gridMinutes,
  gridOf,
  init,
  Message,
  OutMessage,
  resizeRange,
  selectedSlots,
  selectionRange,
  slotIndexAt,
  update
} from "./interaction.ts"
import type { Dated, Model } from "./interaction.ts"

const event = (id: string, start: string, end: string): ScheduleEvent => ({
  id,
  title: id,
  start: `2025-01-15 ${start}`,
  end: `2025-01-15 ${end}`,
  color: "blue"
})

const a = event("a", "09:00:00", "10:00:00")
const b = event("b", "11:00:00", "12:00:00")

const context: Dated = {
  date: "2025-01-15",
  events: [a, b],
  startTime: "08:00:00",
  endTime: "18:00:00",
  intervalMinutes: 15
}

const time = (value: string) => `2025-01-15 ${value}`

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const interaction = (ctx: Dated) => listingOutMessages((current: Model, sent: Message) => update(current, sent, ctx))

const played = (messages: ReadonlyArray<Message>, ctx: Dated, ...steps: ReadonlyArray<Step>) =>
  story(interaction(ctx), given(init()), ...messages.map(message), ...steps)

const from = (start: Model, messages: ReadonlyArray<Message>, ctx: Dated, ...steps: ReadonlyArray<Step>) =>
  story(interaction(ctx), given(start), ...messages.map(message), ...steps)

const after = (messages: ReadonlyArray<Message>, ctx: Dated = context) => modelAfter(interaction(ctx), init(), messages)

const idle = model<Model>((current) => expect(current).toEqual(init()))

const none = Option.none<string>()

const drag = (
  eventId: string,
  minutes: number,
  target: "slot" | "midnight" | "sameTime" = "slot",
  date = "2025-01-15"
) => Message.StartedDrag({ resourceId: none, date, target, eventId, minutes })

const moveTo = (minutes: number, date = "2025-01-15") => Message.MovedPointer({ resourceId: none, date, minutes })

const resize = (eventId: string, edge: "start" | "end", byDay = false) =>
  Message.StartedResize({ byDay, eventId, edge })

describe("day view grid math", () => {
  it("measures the grid and finds slots", () => {
    expect(gridMinutes(context)).toBe(600)
    expect(gridMinutes({ date: "2025-01-15", events: [] })).toBe(1440)
    expect(slotIndexAt(gridOf(context), -5)).toBe(0)
    expect(slotIndexAt(gridOf(context), 70)).toBe(4)
    expect(slotIndexAt(gridOf(context), 10_000)).toBe(39)
  })

  it("drops an event on the slot under the pointer, keeping its length", () => {
    expect(dropRange(context, a, 70)).toEqual({ start: time("09:00:00"), end: time("10:00:00") })
    expect(dropRange(context, a, 125)).toEqual({ start: time("10:00:00"), end: time("11:00:00") })
  })

  it("snaps a drop to eventDragInterval inside the day", () => {
    const fine = { ...context, eventDragInterval: 5 }
    expect(dropRange(fine, a, 62).start).toBe(time("09:00:00"))
    expect(dropRange(fine, a, 1000).start).toBe(time("17:55:00"))
    expect(dropRange(fine, a, -100).start).toBe(time("08:00:00"))
    expect(dropRange({ ...fine, startTime: "08:07:00", endTime: "08:09:00" }, a, 1).start).toBe(time("08:07:00"))
  })

  it("resizes either edge, snapped and never shorter than a step", () => {
    expect(resizeRange(context, a, "end", 150)).toEqual({ start: a.start, end: time("10:30:00") })
    expect(resizeRange(context, a, "end", 10)).toEqual({ start: a.start, end: time("09:15:00") })
    expect(resizeRange(context, a, "end", 9999).end).toBe(time("18:00:00"))
    expect(resizeRange(context, a, "start", 30)).toEqual({ start: time("08:30:00"), end: a.end })
    expect(resizeRange(context, a, "start", 200).start).toBe(time("09:45:00"))
    expect(resizeRange({ ...context, eventResizeInterval: 30 }, a, "end", 100).end).toBe(time("09:30:00"))
  })

  it("selects whole slots between two points", () => {
    expect(selectionRange(context, 5, 2)).toEqual({ rangeStart: time("08:30:00"), rangeEnd: time("09:30:00") })
    expect(selectionRange({ ...context, endTime: "17:50:00" }, 39, 39).rangeEnd).toBe(time("17:50:00"))
  })
})

const across = (fromDate: string, to: string, ...steps: ReadonlyArray<Step>) =>
  played(
    [Message.StartedDaySelect({ resourceId: none, date: fromDate }), moveTo(0, to), Message.Released()],
    context,
    ...steps
  )

describe("day view interactions, as the drag, resize and slot select hooks", () => {
  it("drags an event", () =>
    played(
      [drag("a", 125)],
      context,
      model((current) =>
        expect(current.interaction).toEqual({
          _tag: "Dragging",
          eventId: "a",
          target: "slot",
          resourceId: none,
          start: time("10:00:00"),
          end: time("11:00:00"),
          valid: true
        })
      )
    ))

  it("drops a dragged event where the pointer is", () =>
    played(
      [drag("a", 125), moveTo(245), Message.Released()],
      context,
      idle,
      expectOutMessage([
        OutMessage.EventDropped({
          resourceId: none,
          eventId: "a",
          newStart: time("12:00:00"),
          newEnd: time("13:00:00")
        })
      ])
    ))

  it("reports nothing for an event dropped where it was, and ignores an unknown event", () => {
    played([drag("a", 70), Message.Released()], context, expectNoOutMessage())
    played([drag("gone", 70)], context, idle)
  })

  it("rejects drops that overlap", () => {
    const strict = { ...context, preventEventOverlap: true }
    played(
      [drag("a", 185)],
      strict,
      model((current) => expect(current.interaction).toMatchObject({ valid: false })),
      message(Message.Released()),
      expectOutMessage([
        OutMessage.DropRejected({
          resourceId: none,
          eventId: "a",
          start: time("11:00:00"),
          end: time("12:00:00"),
          conflicts: ["b"],
          reason: "overlap"
        })
      ])
    )
  })

  it("rejects drops the caller refuses", () =>
    played(
      [drag("a", 125), Message.Released()],
      { ...context, canDropEvent: () => false },
      expectOutMessage([
        OutMessage.DropRejected({
          resourceId: none,
          eventId: "a",
          start: time("10:00:00"),
          end: time("11:00:00"),
          conflicts: [],
          reason: "rejected"
        })
      ])
    ))

  it("resizes an event and reports it", () => {
    played(
      [resize("a", "end")],
      context,
      model((current) =>
        expect(current.interaction).toEqual({
          _tag: "Resizing",
          byDay: false,
          eventId: "a",
          edge: "end",
          start: a.start,
          end: a.end,
          valid: true
        })
      ),
      message(moveTo(150)),
      message(Message.Released()),
      expectOutMessage([OutMessage.EventResized({ eventId: "a", newStart: a.start, newEnd: time("10:30:00") })])
    )
    played([resize("a", "start"), Message.Released()], context, expectNoOutMessage())
    played([resize("gone", "end")], context, idle)
  })

  it("rejects resizes that overlap or that the caller refuses", () => {
    played(
      [resize("a", "end"), moveTo(240), Message.Released()],
      { ...context, preventEventOverlap: true },
      expectOutMessage([
        OutMessage.ResizeRejected({
          eventId: "a",
          start: a.start,
          end: time("12:00:00"),
          edge: "end",
          conflicts: ["b"],
          reason: "overlap"
        })
      ])
    )
    played(
      [resize("a", "end"), moveTo(150), Message.Released()],
      { ...context, canResizeEventTo: () => false },
      expectOutMessage([
        OutMessage.ResizeRejected({
          eventId: "a",
          start: a.start,
          end: time("10:30:00"),
          edge: "end",
          conflicts: [],
          reason: "rejected"
        })
      ])
    )
  })

  it("keeps an interaction whose event disappeared, then ends it quietly", () => {
    const dragging: Model = {
      interaction: {
        _tag: "Dragging",
        resourceId: none,
        eventId: "gone",
        target: "slot",
        start: "",
        end: "",
        valid: true
      }
    }
    const resizing: Model = {
      interaction: { _tag: "Resizing", byDay: false, eventId: "gone", edge: "end", start: "", end: "", valid: true }
    }
    from(
      dragging,
      [moveTo(10)],
      context,
      model((current) => expect(current).toEqual(dragging)),
      message(Message.Released()),
      idle,
      expectNoOutMessage()
    )
    from(
      resizing,
      [moveTo(10)],
      context,
      model((current) => expect(current).toEqual(resizing)),
      message(Message.Released()),
      idle,
      expectNoOutMessage()
    )
  })

  it("selects slots by dragging across them, staying on its day", () => {
    const selecting = after([Message.StartedSelect({ resourceId: none, date: "2025-01-15", minutes: 35 }), moveTo(80)])
    expect(selectedSlots(selecting)).toEqual(Option.some({ date: "2025-01-15", first: 2, last: 5 }))
    expect(selectedSlots(init())).toEqual(Option.none())
    from(
      selecting,
      [moveTo(300, "2025-01-16")],
      context,
      model((current) => expect(current).toEqual(selecting)),
      message(Message.Released()),
      expectOutMessage([
        OutMessage.SlotsSelected({ resourceId: none, rangeStart: time("08:30:00"), rangeEnd: time("09:30:00") })
      ])
    )
  })

  it("ignores moves and releases while idle, and cancels anything", () => {
    played([moveTo(10), Message.Released()], context, idle, expectNoOutMessage())
    played(
      [Message.StartedSelect({ resourceId: none, date: "2025-01-15", minutes: 35 }), Message.Cancelled()],
      context,
      idle,
      expectNoOutMessage()
    )
    played(
      [Message.StartedSelect({ resourceId: none, date: "2025-01-15", minutes: 35 }), moveTo(40), Message.Released()],
      context,
      idle,
      expectNoOutMessage()
    )
  })

  it("reports items dropped from outside at the slot they land on", () => {
    const data = { "text/plain": "Call Sam" }
    const dropped = Message.DroppedExternal({ resourceId: none, date: "2025-01-15", minutes: 70, data })
    const reported = expectOutMessage([
      OutMessage.ExternalEventDropped({ resourceId: none, data, start: time("09:00:00") })
    ])
    played([dropped], context, reported)
    played([dropped], { ...context, canDropExternalEvent: () => false }, expectNoOutMessage())
    played([dropped], { ...context, canDropExternalEvent: () => true }, reported)
  })

  it("drags all-day events to midnight of another day, keeping their length", () => {
    const trip = { id: "trip", title: "Trip", start: "2025-01-15 00:00:00", end: "2025-01-17 00:00:00", color: "blue" }
    played(
      [drag("trip", 0, "midnight", "2025-01-16"), moveTo(300, "2025-01-18")],
      { ...context, events: [trip] },
      model((current) =>
        expect(current.interaction).toMatchObject({
          start: "2025-01-18 00:00:00",
          end: "2025-01-20 00:00:00",
          target: "midnight"
        })
      )
    )
  })

  it("drags month events to the same time on another day", () =>
    played(
      [drag("a", 0, "sameTime", "2025-01-20"), Message.Released()],
      context,
      expectOutMessage([
        OutMessage.EventDropped({
          resourceId: none,
          eventId: "a",
          newStart: "2025-01-20 09:00:00",
          newEnd: "2025-01-20 10:00:00"
        })
      ])
    ))

  it("selects whole days by dragging across them", () => {
    across(
      "2025-01-15",
      "2025-01-13",
      expectOutMessage([
        OutMessage.SlotsSelected({
          resourceId: none,
          rangeStart: "2025-01-13 00:00:00",
          rangeEnd: "2025-01-15 23:59:59"
        })
      ])
    )
    across(
      "2025-01-13",
      "2025-01-16",
      expectOutMessage([
        OutMessage.SlotsSelected({
          resourceId: none,
          rangeStart: "2025-01-13 00:00:00",
          rangeEnd: "2025-01-16 23:59:59"
        })
      ])
    )
    across("2025-01-13", "2025-01-13", expectNoOutMessage())
  })

  it("moves events between resources, checking overlaps on the resource they land on", () => {
    const roomA = {
      id: "ra",
      title: "A",
      start: time("09:00:00"),
      end: time("10:00:00"),
      color: "blue",
      resourceId: "room-a"
    }
    const roomB = {
      id: "rb",
      title: "B",
      start: time("09:00:00"),
      end: time("10:00:00"),
      color: "red",
      resourceId: "room-b"
    }
    const rooms: Dated = { ...context, events: [roomA, roomB], preventEventOverlap: true }
    const toRoom = (room: string, minutes: number, ...steps: ReadonlyArray<Step>) =>
      played(
        [
          Message.StartedDrag({
            resourceId: Option.some(room),
            date: "2025-01-15",
            eventId: "ra",
            minutes,
            target: "slot"
          }),
          Message.Released()
        ],
        rooms,
        ...steps
      )
    toRoom(
      "room-b",
      185,
      expectOutMessage([
        OutMessage.EventDropped({
          eventId: "ra",
          newStart: time("11:00:00"),
          newEnd: time("12:00:00"),
          resourceId: Option.some("room-b")
        })
      ])
    )
    toRoom(
      "room-b",
      65,
      expectOutMessage([
        OutMessage.DropRejected({
          eventId: "ra",
          start: time("09:00:00"),
          end: time("10:00:00"),
          conflicts: ["rb"],
          reason: "overlap",
          resourceId: Option.some("room-b")
        })
      ])
    )
    toRoom("room-a", 65, expectNoOutMessage())
  })

  it("keeps a slot selection on its resource", () => {
    const rooms: Dated = { ...context, preventEventOverlap: true }
    const selecting = after(
      [Message.StartedSelect({ resourceId: Option.some("room-a"), date: "2025-01-15", minutes: 5 })],
      rooms
    )
    from(
      selecting,
      [Message.MovedPointer({ resourceId: Option.some("room-b"), date: "2025-01-15", minutes: 95 })],
      rooms,
      model((current) => expect(current).toEqual(selecting))
    )
  })

  it("resizes by whole days for the month grid", () => {
    const trip = {
      id: "trip",
      title: "Trip",
      start: time("09:00:00"),
      end: "2025-01-17 00:00:00",
      color: "blue",
      resourceId: "r"
    }
    const meeting = {
      id: "meet",
      title: "Meet",
      start: time("09:00:00"),
      end: time("10:00:00"),
      color: "red",
      resourceId: "r"
    }
    const days: Dated = { ...context, events: [trip, meeting] }
    const byDay = (eventId: string, edge: "start" | "end", date: string, newStart: string, newEnd: string) =>
      played(
        [
          resize(eventId, edge, true),
          Message.MovedPointer({ resourceId: Option.some("r"), date, minutes: 0 }),
          Message.Released()
        ],
        days,
        expectOutMessage([OutMessage.EventResized({ eventId, newStart, newEnd })])
      )
    byDay("trip", "end", "2025-01-18", trip.start, "2025-01-19 00:00:00")
    byDay("trip", "end", "2025-01-10", trip.start, "2025-01-16 00:00:00")
    byDay("meet", "end", "2025-01-16", meeting.start, "2025-01-16 10:00:00")
    byDay("trip", "start", "2025-01-13", "2025-01-13 09:00:00", trip.end)
    byDay("trip", "start", "2025-01-20", "2025-01-16 09:00:00", trip.end)
  })

  it("selects days on one resource", () => {
    const selecting = after([Message.StartedDaySelect({ resourceId: Option.some("r"), date: "2025-01-13" })])
    from(
      selecting,
      [Message.MovedPointer({ resourceId: Option.some("s"), date: "2025-01-15", minutes: 0 })],
      context,
      model((current) => expect(current).toEqual(selecting)),
      message(Message.MovedPointer({ resourceId: Option.some("r"), date: "2025-01-15", minutes: 0 })),
      message(Message.Released()),
      expectOutMessage([
        OutMessage.SlotsSelected({
          rangeStart: "2025-01-13 00:00:00",
          rangeEnd: "2025-01-15 23:59:59",
          resourceId: Option.some("r")
        })
      ])
    )
  })
})
