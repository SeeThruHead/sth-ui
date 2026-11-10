import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  displayStep,
  init,
  isInView,
  Message,
  OutMessage,
  overlayHitPath,
  showsTooltip,
  spotlightRect,
  update
} from "./model.ts"
import type { Model, TourContext } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const guided = { stepsCount: 3 }

const beacon = { stepsCount: 3, mode: "beacon" as const }

const tour = (context: TourContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const key = (value: string, insideTarget = false) => Message.PressedKey({ key: value, insideTarget })

const startedIn = (context: TourContext, messages: ReadonlyArray<Message> = []) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), init({ id: "tour" }), [
    Message.Started(),
    ...messages
  ])

const unchanged = (context: TourContext, from: Model, sent: Message) =>
  story(
    tour(context),
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage()
  )

const atStep = (expected: number) => model<Model>((current) => expect(current.step).toBe(expected))

const active = (expected: boolean) => model<Model>((current) => expect(current.active).toBe(expected))

describe("Tour in guided mode", () => {
  it("starts at the default step and opens it", () =>
    story(
      tour(guided),
      given(init({ id: "tour", defaultStep: 1 })),
      model((current) => expect(showsTooltip(current, guided)).toBe(false)),
      message(Message.Started()),
      active(true),
      expectOutMessage([OutMessage.StepOpened({ step: 1 })])
    ))

  it("starts active when asked to", () => expect(init({ id: "tour", active: true }).active).toBe(true))

  it("starts at a chosen step", () =>
    story(
      tour(guided),
      given(init({ id: "tour", defaultStep: 1 })),
      message(Message.StartedAt({ step: 2 })),
      expectOutMessage([OutMessage.StepChanged({ step: 2 }), OutMessage.StepOpened({ step: 2 })])
    ))

  it("moves between steps and closes back to the default step", () =>
    story(
      tour(guided),
      given(startedIn(guided)),
      message(Message.SetStep({ step: 1 })),
      expectOutMessage([
        OutMessage.StepChanged({ step: 1 }),
        OutMessage.StepClosed({ step: 0 }),
        OutMessage.StepOpened({ step: 1 })
      ]),
      message(Message.SetStep({ step: 1 })),
      expectNoOutMessage(),
      message(Message.Closed()),
      active(false),
      atStep(0),
      expectOutMessage([OutMessage.StepChanged({ step: 0 }), OutMessage.StepClosed({ step: 1 }), OutMessage.Closed()])
    ))

  it("tells the app it closed even when it never started", () =>
    story(
      tour(guided),
      given(init({ id: "tour" })),
      message(Message.Closed()),
      expectOutMessage([OutMessage.Closed()])
    ))

  it("follows the arrow keys", () =>
    story(
      tour(guided),
      given(startedIn(guided)),
      message(key("ArrowRight")),
      atStep(1),
      message(key("ArrowRight")),
      atStep(2),
      message(key("ArrowLeft")),
      atStep(1),
      message(key("ArrowRight")),
      message(key("ArrowRight")),
      active(false)
    ))

  it("closes on Escape", () => story(tour(guided), given(startedIn(guided)), message(key("Escape")), active(false)))

  it("ignores keys it should not follow", () => {
    const started = startedIn(guided)
    unchanged(guided, started, key("ArrowLeft"))
    unchanged(guided, started, key("ArrowRight", true))
    unchanged({ ...guided, withKeyboardNavigation: false }, started, key("ArrowRight"))
    unchanged(guided, started, key("Enter"))
    unchanged({ ...guided, closeOnEscape: false }, started, key("Escape"))
    unchanged(guided, init({ id: "tour" }), key("ArrowRight"))
    unchanged(guided, started, Message.CompletedMount())
  })
})

describe("Tour in beacon mode", () => {
  it("shows beacons until one opens its step, and Escape goes back to them", () =>
    story(
      tour(beacon),
      given(init({ id: "tour" })),
      message(Message.Started()),
      expectNoOutMessage(),
      model((current) => expect(showsTooltip(current, beacon)).toBe(false)),
      model((current) => expect(displayStep(current, beacon)).toBe(0)),
      message(Message.OpenedBeacon({ step: 2 })),
      model((current) => expect(displayStep(current, beacon)).toBe(2)),
      expectOutMessage([OutMessage.StepChanged({ step: 2 }), OutMessage.StepOpened({ step: 2 })]),
      message(Message.SetStep({ step: 1 })),
      model((current) => expect(current.beaconStep).toBe(1)),
      message(key("Escape")),
      model((current) => expect(current.beaconStep).toBeNull()),
      expectOutMessage([OutMessage.StepClosed({ step: 1 }), OutMessage.Closed()])
    ))

  it("moves no beacon before one is open, and ignores keys and Escape then", () => {
    const started = startedIn(beacon)
    story(
      tour(beacon),
      given(started),
      message(Message.SetStep({ step: 1 })),
      model((current) => expect(current.beaconStep).toBeNull())
    )
    unchanged(beacon, started, key("Escape"))
    unchanged(beacon, startedIn(beacon, [Message.OpenedBeacon({ step: 2 })]), key("ArrowRight"))
  })

  it("ends the tour", () =>
    story(
      tour(beacon),
      given(startedIn(beacon, [Message.OpenedBeacon({ step: 2 })])),
      message(Message.Ended()),
      active(false),
      model((current) => expect(current.beaconStep).toBeNull())
    ))
})

describe("Tour geometry", () => {
  const target = { top: 100, left: 50, width: 80, height: 20 }

  it("pads the spotlight and cuts it out of the hit path", () => {
    expect(spotlightRect(target, 8)).toEqual({ top: 92, left: 42, width: 96, height: 36 })
    expect(overlayHitPath(null, 8, 4)).toBe("M-100000 -100000H100000V100000H-100000Z")
    expect(overlayHitPath(target, 8, 4)).toBe(
      "M-100000 -100000H100000V100000H-100000ZM46 92H134A4 4 0 0 1 138 96V124A4 4 0 0 1 134 128H46A4 4 0 0 1 42 124V96A4 4 0 0 1 46 92Z"
    )
    expect(overlayHitPath(target, 0, 50)).toContain("A10 10")
  })

  it("knows whether the target is in view of the viewport and every scroll container", () => {
    const viewport = { top: 0, left: 0, width: 1000, height: 800 }
    expect(isInView(target, viewport, [])).toBe(true)
    expect(isInView({ ...target, width: 0, height: 0 }, viewport, [])).toBe(false)
    expect(isInView({ ...target, top: 790 }, viewport, [])).toBe(false)
    expect(isInView({ ...target, left: -1 }, viewport, [])).toBe(false)
    expect(isInView({ ...target, left: 990 }, viewport, [])).toBe(false)
    expect(isInView({ ...target, top: -5 }, viewport, [])).toBe(false)
    expect(isInView(target, viewport, [{ top: 0, left: 0, width: 100, height: 800 }])).toBe(false)
    expect(isInView(target, viewport, [viewport])).toBe(true)
    expect(isInView({ ...target, width: 0 }, viewport, [])).toBe(true)
  })
})
