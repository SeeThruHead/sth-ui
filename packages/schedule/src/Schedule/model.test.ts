import { Option } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { popoverOpened } from "@sth-ui/core/testing/popover.ts"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import * as Interaction from "../DayView/interaction.ts"
import { Change, gotView, init, Message, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, expectOutMessage, given, message, model, story } = Story

const context = {
  events: [{ id: "a", title: "A", start: "2025-01-15 09:00:00", end: "2025-01-15 10:00:00", color: "blue" }],
  startTime: "08:00:00",
  endTime: "18:00:00"
}

const schedule = listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const start = init({ id: "s", date: "2025-01-15" })

const interacted = (inner: Interaction.Message) =>
  Message.GotView({ message: { _tag: "GotInteraction", message: inner } })

describe("schedule state, as Schedule's uncontrolled date and view", () => {
  it("starts on a week", () => {
    expect(start).toMatchObject({ date: "2025-01-15", view: "week", selectedDate: "2025-01-15" })
    expect(init({ id: "s", date: "2025-01-15", view: "day" }).view).toBe("day")
  })

  it("tracks the date and the view", () =>
    story(
      schedule,
      given(start),
      message(Message.ChangedDate({ date: "2025-01-22" })),
      model((current) => expect(current.date).toBe("2025-01-22")),
      expectOutMessage([Change.DateChanged({ date: "2025-01-22" })]),
      message(Message.ChangedView({ view: "month" })),
      expectOutMessage([Change.ViewChanged({ view: "month" })])
    ))

  it("opens a month, reporting the date and the view", () =>
    story(
      schedule,
      given(start),
      message(Message.OpenedMonth({ date: "2025-03-01" })),
      model((current) => expect(current).toMatchObject({ date: "2025-03-01", view: "month" })),
      expectOutMessage([Change.DateChanged({ date: "2025-03-01" }), Change.ViewChanged({ view: "month" })])
    ))

  it("tracks the selected day", () =>
    story(
      schedule,
      given(start),
      message(Message.SelectedDay({ date: "2025-01-20" })),
      model((current) => expect(current.selectedDate).toBe("2025-01-20"))
    ))

  it("passes view messages through and reports their outcome", () =>
    story(
      schedule,
      given(start),
      message(
        interacted(
          Interaction.Message.StartedDrag({
            resourceId: Option.none(),
            eventId: "a",
            date: "2025-01-15",
            minutes: 125,
            target: "slot"
          })
        )
      ),
      message(interacted(Interaction.Message.Released())),
      expectOutMessage([
        Interaction.OutMessage.EventDropped({
          resourceId: Option.none(),
          eventId: "a",
          newStart: "2025-01-15 10:00:00",
          newEnd: "2025-01-15 11:00:00"
        })
      ]),
      Command.expectNone()
    ))

  it("opens the more events popover of a view", () => {
    story(
      schedule,
      given(start),
      message(Message.GotView({ message: { _tag: "OpenedMoreEvents", date: "2025-01-15" } })),
      model((current) => expect(current.views.moreDate).toBe("2025-01-15")),
      popoverOpened()
    )
    expect(gotView({ _tag: "ToggledAgenda" })).toEqual(Message.GotView({ message: { _tag: "ToggledAgenda" } }))
  })
})
