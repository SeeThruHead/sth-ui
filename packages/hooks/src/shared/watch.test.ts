import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, MutableRef, Stream } from "effect"
import { watch } from "./watch.ts"

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

describe("watch", () => {
  it.effect("reads on start and when any watched event fires", () =>
    Effect.gen(function* () {
      const value = MutableRef.make(1)
      const first = new EventTarget()
      const second = new EventTarget()
      const fiber = yield* watch(
        [
          [first, ["a", "b"]],
          [second, ["c"]]
        ],
        () => MutableRef.get(value)
      ).pipe(Stream.take(4), Stream.runCollect, Effect.forkChild)
      yield* settle
      MutableRef.set(value, 2)
      first.dispatchEvent(new Event("b"))
      first.dispatchEvent(new Event("z"))
      MutableRef.set(value, 3)
      second.dispatchEvent(new Event("c"))
      first.dispatchEvent(new Event("a"))
      const values = yield* Fiber.join(fiber)
      expect(values).toEqual([1, 2, 3, 3])
    })
  )
})
