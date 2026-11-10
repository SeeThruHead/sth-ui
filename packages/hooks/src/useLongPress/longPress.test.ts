import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Stream } from "effect"
import { TestClock } from "effect/testing"
import { longPressOn, pointOf, PressAction, pressState, pressStep } from "./longPress.ts"

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

const mouse = (type: string, clientX = 0, clientY = 0) =>
  new (class extends Event {
    readonly clientX = clientX
    readonly clientY = clientY
  })(type)

const touch = (type: string, clientX = 0, clientY = 0) =>
  new (class extends Event {
    readonly touches = [{ clientX, clientY }]
  })(type)

const run = (steps: ReadonlyArray<PressAction>, cancelOnMove?: boolean | number) =>
  steps.reduce<readonly [typeof pressState, ReadonlyArray<string>]>(
    ([state, out], action) => {
      const [next, more] = pressStep(state, action, cancelOnMove)

      return [next, [...out, ...more]]
    },
    [pressState, []]
  )[1]

describe("long press, as Mantine's useLongPress", () => {
  it("starts, fires after the threshold and finishes, or cancels when released early", () => {
    expect(run([PressAction.Down({ x: 0, y: 0 }), PressAction.Elapsed({ press: 1 }), PressAction.End()])).toEqual([
      "started",
      "longPressed",
      "finished"
    ])
    expect(run([PressAction.Down({ x: 0, y: 0 }), PressAction.End(), PressAction.Elapsed({ press: 1 })])).toEqual([
      "started",
      "cancelled"
    ])
    expect(run([PressAction.End()])).toEqual([])
    expect(
      run([
        PressAction.Down({ x: 0, y: 0 }),
        PressAction.End(),
        PressAction.Down({ x: 0, y: 0 }),
        PressAction.Elapsed({ press: 1 })
      ])
    ).toEqual(["started", "cancelled", "started"])
    expect(
      run([PressAction.Down({ x: 0, y: 0 }), PressAction.Elapsed({ press: 1 }), PressAction.Elapsed({ press: 1 })])
    ).toEqual(["started", "longPressed"])
  })

  it("cancels on movement past the limit only when asked", () => {
    const moved = [PressAction.Down({ x: 0, y: 0 }), PressAction.Move({ x: 8, y: 8 })]
    expect(run(moved)).toEqual(["started"])
    expect(run(moved, true)).toEqual(["started", "cancelled"])
    expect(run(moved, 20)).toEqual(["started"])
    expect(run(moved, false)).toEqual(["started"])
    expect(run([PressAction.Move({ x: 50, y: 0 })], true)).toEqual([])
  })

  it("reads mouse and touch positions", () => {
    expect(pointOf(mouse("mousedown", 3, 4))).toEqual({ x: 3, y: 4 })
    expect(pointOf(touch("touchstart", 5, 6))).toEqual({ x: 5, y: 6 })
  })

  it.effect("follows mouse and touch events with the threshold timer", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const fiber = yield* longPressOn(target, { threshold: 500, cancelOnMove: true }).pipe(
        Stream.take(6),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* settle
      target.dispatchEvent(mouse("mousedown"))
      yield* settle
      yield* TestClock.adjust("500 millis")
      target.dispatchEvent(mouse("mouseup"))
      target.dispatchEvent(touch("touchstart"))
      yield* settle
      target.dispatchEvent(touch("touchmove", 30, 0))
      yield* settle
      yield* TestClock.adjust("500 millis")
      target.dispatchEvent(touch("touchstart"))
      yield* settle
      target.dispatchEvent(touch("touchcancel"))
      const outputs = yield* Fiber.join(fiber)
      expect(outputs).toEqual(["started", "longPressed", "finished", "started", "cancelled", "started"])
    })
  )

  it.effect("listens only to the chosen events", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const plain = new EventTarget()
      const defaults = yield* longPressOn(plain).pipe(Stream.take(1), Stream.runCollect, Effect.forkChild)
      yield* settle
      plain.dispatchEvent(mouse("mousedown"))
      const started = yield* Fiber.join(defaults)
      expect(started).toEqual(["started"])
      const fiber = yield* longPressOn(target, { events: ["touch"] }).pipe(
        Stream.take(1),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* settle
      target.dispatchEvent(mouse("mousedown"))
      target.dispatchEvent(touch("touchstart"))
      const outputs = yield* Fiber.join(fiber)
      expect(outputs).toEqual(["started"])
    })
  )
})
