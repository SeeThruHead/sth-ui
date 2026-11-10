import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Stream } from "effect"
import { eventsOf } from "./windowEvent.ts"

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

describe("event streams, as Mantine's useWindowEvent", () => {
  it.effect("emits each event of the type", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const fiber = yield* eventsOf(target, "ping").pipe(
        Stream.map((event) => event.type),
        Stream.take(2),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* settle
      target.dispatchEvent(new Event("pong"))
      target.dispatchEvent(new Event("ping"))
      target.dispatchEvent(new Event("ping"))
      const result1 = yield* Fiber.join(fiber)
      expect(result1).toEqual(["ping", "ping"])
      const result2 = yield* eventsOf(target, "x", { once: true }).pipe(Stream.take(0), Stream.runCollect)
      expect(result2).toEqual([])
    })
  )
})
