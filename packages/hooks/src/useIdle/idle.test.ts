import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Stream } from "effect"
import { TestClock } from "effect/testing"
import { idleChanges } from "./idle.ts"

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

describe("idle stream, as Mantine's useIdle", () => {
  it.effect("goes idle after the timeout and wakes on activity", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const fiber = yield* idleChanges(target, "1 second", { events: ["click"] }).pipe(
        Stream.take(4),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* settle
      yield* TestClock.adjust("1 second")
      target.dispatchEvent(new Event("click"))
      yield* settle
      yield* TestClock.adjust("500 millis")
      target.dispatchEvent(new Event("click"))
      yield* settle
      yield* TestClock.adjust("1 second")
      target.dispatchEvent(new Event("keydown"))
      target.dispatchEvent(new Event("click"))
      yield* settle
      const result1 = yield* Fiber.join(fiber)
      expect(result1).toEqual([true, false, true, false])
    })
  )

  it.effect("listens to Mantine's events by default", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const fiber = yield* idleChanges(target, "1 second").pipe(Stream.take(2), Stream.runCollect, Effect.forkChild)
      yield* settle
      yield* TestClock.adjust("1 second")
      target.dispatchEvent(new Event("wheel"))
      const result2 = yield* Fiber.join(fiber)
      expect(result2).toEqual([true, false])
    })
  )
})
