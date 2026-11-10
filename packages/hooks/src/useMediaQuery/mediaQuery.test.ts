import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, MutableRef, Stream } from "effect"
import { colorSchemeChanges } from "../useColorScheme/colorScheme.ts"
import { orientationChanges } from "../useOrientation/orientation.ts"
import type { Orientation } from "../useOrientation/orientation.ts"
import { mediaQueryMatches } from "./mediaQuery.ts"

const targetOf = () => {
  const target = new EventTarget()

  return {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target)
  }
}

const listOf = (matches: boolean) => ({ ...targetOf(), matches })

const changeOf = (matches: boolean) =>
  new (class extends Event {
    readonly matches = matches
  })("change")

const screenOf = (current: MutableRef.MutableRef<Orientation>) => ({
  ...targetOf(),
  get angle() {
    return MutableRef.get(current).angle
  },
  get type() {
    return MutableRef.get(current).type
  }
})

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

describe("media query, color scheme and orientation streams", () => {
  it.effect("starts with the current match and follows changes", () =>
    Effect.gen(function* () {
      const source = listOf(false)
      const fiber = yield* mediaQueryMatches(source).pipe(Stream.take(3), Stream.runCollect, Effect.forkChild)
      yield* settle
      source.dispatchEvent(changeOf(true))
      source.dispatchEvent(changeOf(false))
      const result1 = yield* Fiber.join(fiber)
      expect(result1).toEqual([false, true, false])
    })
  )

  it.effect("reads dark or light", () =>
    Effect.gen(function* () {
      const result2 = yield* colorSchemeChanges(listOf(true)).pipe(Stream.take(1), Stream.runCollect)
      expect(result2).toEqual(["dark"])
      const result3 = yield* colorSchemeChanges(listOf(false)).pipe(Stream.take(1), Stream.runCollect)
      expect(result3).toEqual(["light"])
    })
  )

  it.effect("reads the screen orientation when it changes", () =>
    Effect.gen(function* () {
      const current = MutableRef.make<Orientation>({ angle: 0, type: "landscape-primary" })
      const screen = screenOf(current)
      const fiber = yield* orientationChanges(screen).pipe(Stream.take(2), Stream.runCollect, Effect.forkChild)
      yield* settle
      MutableRef.set(current, { angle: 90, type: "portrait-primary" })
      screen.dispatchEvent(new Event("change"))
      MutableRef.set(current, { angle: 180, type: "landscape-secondary" })
      const changes = yield* Fiber.join(fiber)
      expect(changes).toEqual([
        { angle: 0, type: "landscape-primary" },
        { angle: 90, type: "portrait-primary" }
      ])
    })
  )
})
