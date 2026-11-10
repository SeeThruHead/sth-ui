import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { addToQueue, cleanQueue, makeQueue, updateQueue } from "./queue.ts"

const limit = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10 }))

describe("queue, as Mantine's useQueue", () => {
  it("splits values at the limit", () => {
    expect(makeQueue(2, [1, 2, 3])).toEqual({ state: [1, 2], queue: [3] })
    expect(makeQueue<number>(2)).toEqual({ state: [], queue: [] })
    expect(cleanQueue(addToQueue(makeQueue(1, [1]), 1, 2, 3))).toEqual({ state: [1], queue: [] })
    expect(updateQueue(makeQueue(2, [1, 2, 3]), 2, (items) => items.filter((item) => item !== 1))).toEqual({
      state: [2, 3],
      queue: []
    })
  })

  it.prop(
    "never shows more than the limit and keeps every item in order",
    [limit, Schema.Array(Schema.Int), Schema.Array(Schema.Int)],
    ([size, first, more]) => {
      const queue = addToQueue(makeQueue(size, first), size, ...more)
      expect(queue.state.length).toBeLessThanOrEqual(size)
      expect([...queue.state, ...queue.queue]).toEqual([...first, ...more])
      expect(queue.queue.length === 0 || queue.state.length === size).toBe(true)
    }
  )
})
