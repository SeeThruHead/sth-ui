import { Option } from "effect"
import { describe, expect, it } from "@effect/vitest"
import * as Popover from "@foldkit/ui/popover"
import { Story } from "foldkit/test"
import { popoverOpened } from "@sth-ui/core/testing/popover.ts"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import * as Interaction from "./interaction.ts"
import { gotInteraction, gotMoreEvents, init, Message, OutMessage, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const context = {
  date: "2025-01-15",
  events: [{ id: "a", title: "A", start: "2025-01-15 09:00:00", end: "2025-01-15 10:00:00", color: "blue" }],
  startTime: "08:00:00",
  endTime: "18:00:00"
}

const dayView = listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

describe("day view model", () => {
  it("routes interactions and reports their outcome", () =>
    story(
      dayView,
      given(init({ id: "day" })),
      message(
        gotInteraction(
          Interaction.Message.StartedDrag({
            resourceId: Option.none(),
            date: "2025-01-15",
            target: "slot",
            eventId: "a",
            minutes: 125
          })
        )
      ),
      message(gotInteraction(Interaction.Message.Released())),
      expectOutMessage([
        OutMessage.EventDropped({
          resourceId: Option.none(),
          eventId: "a",
          newStart: "2025-01-15 10:00:00",
          newEnd: "2025-01-15 11:00:00"
        })
      ]),
      Command.expectNone()
    ))

  it("opens the more events popover", () => {
    expect(init({ id: "day" }).moreEvents.id).toBe("day-more")
    story(
      dayView,
      given(init({ id: "day" })),
      message(gotMoreEvents(Popover.Message.ClickedButton())),
      model((current) => expect(current.moreEvents.isOpen).toBe(true)),
      expectNoOutMessage(),
      popoverOpened(),
      message(gotMoreEvents(Popover.Message.CompletedFocusButton())),
      Command.expectNone()
    )
  })

  it("opens and closes the agenda", () =>
    story(
      dayView,
      given(init({ id: "day" })),
      message(Message.ToggledAgenda()),
      model((current) => expect(current.agendaOpen).toBe(true)),
      message(Message.ToggledAgenda()),
      model((current) => expect(current.agendaOpen).toBe(false))
    ))

  it("opens the more events popover for a day", () =>
    story(
      dayView,
      given(init({ id: "month" })),
      message(Message.OpenedMoreEvents({ date: "2025-01-15" })),
      model((current) => expect(current).toMatchObject({ moreDate: "2025-01-15", moreEvents: { isOpen: true } })),
      popoverOpened()
    ))
})
