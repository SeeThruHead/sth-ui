import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Option, Schema, Stream } from "effect"
import { dragInputOf, dragOn, dragState, dragStep } from "./drag.ts"
import type { DragEvent, DragInput, DragOptions } from "./drag.ts"

type Kind = DragInput["kind"]

const input = (kind: Kind, x: number, y: number, time = 0, pointerId = 1, button = 0): DragInput => ({
  kind,
  pointerId,
  button,
  x,
  y,
  time
})

const run = (inputs: ReadonlyArray<DragInput>, options: DragOptions = {}) =>
  inputs.reduce<{ readonly state: typeof dragState; readonly events: ReadonlyArray<DragEvent> }>(
    ({ state, events }, next) => {
      const [after, emitted] = dragStep(state, next, options)

      return { state: after, events: [...events, ...Option.toArray(emitted)] }
    },
    { state: dragState, events: [] }
  )

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

const pointer = (type: string, clientX: number, clientY: number) =>
  new (class extends Event {
    readonly pointerId = 7
    readonly button = 0
    readonly clientX = clientX
    readonly clientY = clientY
  })(type)

describe("drag, as Mantine's useDrag", () => {
  it("fires first on press with no threshold, then moves with movement and delta, then last on release", () => {
    const { events, state } = run([
      input("down", 10, 10, 0),
      input("move", 15, 20, 10),
      input("move", 25, 30, 20),
      input("up", 25, 30, 30)
    ])
    expect(events.map((event) => [event.first, event.last, event.active])).toEqual([
      [true, false, true],
      [false, false, true],
      [false, false, true],
      [false, true, false]
    ])
    expect(events[1]).toMatchObject({
      movement: [5, 10],
      delta: [5, 10],
      distance: [5, 10],
      direction: [1, 1],
      velocity: [0.5, 1]
    })
    expect(events[2]).toMatchObject({ movement: [15, 20], delta: [10, 10], initial: [10, 10], elapsedTime: 20 })
    expect(events[3]).toMatchObject({ velocity: [1, 1], tap: false, canceled: false })
    expect(state.active).toBe(false)
  })

  it("reports leftward and upward movement as negative directions, and keeps velocity when no time passes", () => {
    const { events } = run([input("down", 50, 50, 0), input("move", 40, 45, 10), input("move", 30, 40, 10)])
    expect(events[1]?.direction).toEqual([-1, -1])
    expect(events[2]?.velocity).toEqual([1, 0.5])
  })

  it("drops velocity on a release long after the last move", () => {
    const { events } = run([input("down", 0, 0, 0), input("move", 10, 0, 10), input("up", 10, 0, 500)])
    expect(events.at(-1)?.velocity).toEqual([0, 0])
  })

  it("waits for the threshold, as a number or per axis", () => {
    const quiet = run([input("down", 0, 0), input("move", 3, 3, 10), input("up", 3, 3, 20)], { threshold: 5 })
    expect(quiet.events).toEqual([])
    const moving = run([input("down", 0, 0), input("move", 3, 3, 10), input("move", 6, 0, 20)], { threshold: 5 })
    expect(moving.events).toHaveLength(1)
    expect(moving.events[0]).toMatchObject({ first: true, movement: [6, 0], delta: [3, -3] })
    expect(run([input("down", 0, 0), input("move", 0, 6, 10)], { threshold: [5, 10] }).events).toEqual([])
  })

  it("reports taps when asked", () => {
    const tap = run([input("down", 0, 0), input("move", 1, 1, 10), input("up", 1, 1, 20)], {
      threshold: 5,
      filterTaps: true
    })
    expect(tap.events).toMatchObject([{ tap: true, first: true, last: true, active: false, movement: [1, 1] }])
    const notTap = run([input("down", 0, 0), input("up", 4, 0, 20)], {
      threshold: 5,
      filterTaps: true,
      tapThreshold: 3
    })
    expect(notTap.events[0]?.tap).toBe(false)
    const dragged = run([input("down", 0, 0), input("move", 1, 0, 10), input("up", 1, 0, 20)], { filterTaps: true })
    expect(dragged.events.at(-1)?.tap).toBe(true)
  })

  it("constrains to an axis, or locks to the dominant one", () => {
    expect(run([input("down", 0, 0), input("move", 5, 8, 10)], { axis: "x" }).events[1]?.movement).toEqual([5, 0])
    expect(run([input("down", 0, 0), input("move", 5, 8, 10)], { axis: "y" }).events[1]?.movement).toEqual([0, 8])
    const sideways = run(
      [
        input("down", 0, 0),
        input("move", 0.5, 0.2, 5),
        input("move", 5, 2, 10),
        input("move", 3, 9, 20),
        input("up", 3, 9, 30)
      ],
      {
        axis: "lock"
      }
    )
    expect(sideways.events.map((event) => event.movement)).toEqual([
      [0, 0],
      [0.5, 0.2],
      [5, 0],
      [3, 0],
      [3, 0]
    ])
    expect(
      run([input("down", 0, 0), input("move", 2, 9, 10)], { axis: "lock", axisThreshold: 5 }).events[1]?.movement
    ).toEqual([0, 9])
  })

  it("ignores other buttons, other pointers and a second press", () => {
    expect(run([input("down", 0, 0, 0, 1, 2)]).events).toEqual([])
    const other = run([
      input("down", 0, 0),
      input("move", 5, 5, 10, 2),
      input("up", 5, 5, 10, 2),
      input("cancel", 5, 5, 10, 2)
    ])
    expect(other.events).toHaveLength(1)
    expect(run([input("down", 0, 0), input("down", 9, 9, 5)]).events).toHaveLength(1)
  })

  it("reports a cancel as the last event", () => {
    const { events, state } = run([input("down", 0, 0), input("move", 4, 2, 10), input("cancel", 6, 3, 20)])
    expect(events.at(-1)).toMatchObject({ canceled: true, last: true, active: false, movement: [6, 3], delta: [0, 0] })
    expect(state.active).toBe(false)
  })

  it.prop(
    "movement is always the pointer's offset from where the drag started",
    [Schema.Array(Schema.Tuple([Schema.Int, Schema.Int])).check(Schema.isMinLength(1))],
    ([points]) => {
      const { events } = run([input("down", 0, 0), ...points.map(([x, y], index) => input("move", x, y, index + 1))])
      expect(events.slice(1).map((event) => event.movement)).toEqual(points.map(([x, y]) => [x, y]))
    }
  )

  it("reads pointer events", () => {
    expect(dragInputOf("down", pointer("pointerdown", 3, 4))).toMatchObject({
      kind: "down",
      pointerId: 7,
      button: 0,
      x: 3,
      y: 4
    })
  })

  it.effect("follows pointers pressed on the element and moved on the page", () =>
    Effect.gen(function* () {
      const element = new EventTarget()
      const page = new EventTarget()
      const fiber = yield* dragOn(element, page, {}).pipe(Stream.take(3), Stream.runCollect, Effect.forkChild)
      yield* settle
      element.dispatchEvent(pointer("pointerdown", 0, 0))
      page.dispatchEvent(pointer("pointermove", 4, 3))
      page.dispatchEvent(pointer("pointerup", 4, 3))
      const events = yield* Fiber.join(fiber)
      expect(events.map((event) => [event.first, event.last, event.movement])).toEqual([
        [true, false, [0, 0]],
        [false, false, [4, 3]],
        [false, true, [4, 3]]
      ])
    })
  )
})
