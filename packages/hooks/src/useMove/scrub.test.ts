import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Option, Schema, Stream } from "effect"
import { movePosition, normalizeRadialValue, radialAngle, scrubOn, scrubPoint } from "./scrub.ts"

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

const mouse = (type: string, clientX: number, clientY: number) =>
  new (class extends Event {
    readonly clientX = clientX
    readonly clientY = clientY
  })(type, { cancelable: true })

const touch = (type: string, clientX: number, clientY: number, cancelable = true) =>
  new (class extends Event {
    readonly changedTouches = [{ clientX, clientY }]
  })(type, { cancelable })

const rect = { left: 100, top: 50, width: 200, height: 100 }

describe("move and radial move, as Mantine's useMove and useRadialMove", () => {
  it("places a point within the element, clamped, and mirrored right to left", () => {
    expect(movePosition({ x: 150, y: 75 }, rect, "ltr")).toEqual(Option.some({ x: 0.25, y: 0.25 }))
    expect(movePosition({ x: 150, y: 75 }, rect, "rtl")).toEqual(Option.some({ x: 0.75, y: 0.25 }))
    expect(movePosition({ x: 0, y: 500 }, rect, "ltr")).toEqual(Option.some({ x: 0, y: 1 }))
    expect(movePosition({ x: 0, y: 0 }, { ...rect, width: 0 }, "ltr")).toEqual(Option.none())
    expect(movePosition({ x: 0, y: 0 }, { ...rect, height: 0 }, "ltr")).toEqual(Option.none())
  })

  it("reads angles clockwise from the top", () => {
    const square = { left: 0, top: 0, width: 100, height: 100 }
    expect(radialAngle({ x: 50, y: 0 }, square)).toBeCloseTo(0)
    expect(radialAngle({ x: 100, y: 50 }, square)).toBeCloseTo(90)
    expect(radialAngle({ x: 50, y: 100 }, square)).toBeCloseTo(180)
    expect(radialAngle({ x: 0, y: 50 }, square)).toBeCloseTo(270)
  })

  it("rounds angles to the step as Mantine does", () => {
    expect(normalizeRadialValue(359.9, 1)).toBe(0)
    expect(normalizeRadialValue(45.2, 1)).toBe(46)
    expect(normalizeRadialValue(45.2, 0.5)).toBe(45.5)
    expect(normalizeRadialValue(-5, 0.01)).toBe(0)
  })

  it.prop(
    "keeps every angle on a step between 0 and 360",
    [Schema.Finite.check(Schema.isBetween({ minimum: -720, maximum: 720 })), Schema.Literals([1, 5, 15, 0.5])],
    ([degree, step]) => {
      const value = normalizeRadialValue(degree, step)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(360)
      expect(Math.abs(value / step - Math.round(value / step))).toBeLessThan(1e-6)
    }
  )

  it("reads mouse and touch points", () => {
    expect(scrubPoint(mouse("mousedown", 1, 2))).toEqual({ x: 1, y: 2 })
    expect(scrubPoint(touch("touchend", 3, 4))).toEqual({ x: 3, y: 4 })
  })

  it.effect("starts on the element, follows the page and ends on release", () =>
    Effect.gen(function* () {
      const element = new EventTarget()
      const page = new EventTarget()
      const fiber = yield* scrubOn(element, page).pipe(Stream.take(7), Stream.runCollect, Effect.forkChild)
      yield* settle
      page.dispatchEvent(mouse("mousemove", 0, 0))
      const down = mouse("mousedown", 1, 1)
      element.dispatchEvent(down)
      element.dispatchEvent(mouse("mousedown", 9, 9))
      page.dispatchEvent(mouse("mousemove", 2, 2))
      page.dispatchEvent(mouse("mouseup", 3, 3))
      page.dispatchEvent(mouse("mousemove", 8, 8))
      element.dispatchEvent(touch("touchstart", 4, 4))
      const swipe = touch("touchmove", 5, 5)
      page.dispatchEvent(swipe)
      page.dispatchEvent(touch("touchmove", 7, 7, false))
      page.dispatchEvent(touch("touchend", 6, 6))
      const scrubs = yield* Fiber.join(fiber)
      expect(scrubs.map(({ stage, point }) => `${stage} ${point.x}`)).toEqual([
        "start 1",
        "move 2",
        "end 3",
        "start 4",
        "move 5",
        "move 7",
        "end 6"
      ])
      expect(down.defaultPrevented).toBe(true)
      expect(swipe.defaultPrevented).toBe(true)
    })
  )
})
