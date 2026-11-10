import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { backHistory, currentOf, forwardHistory, setHistory, stateHistory } from "./history.ts"

const steps = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 20 }))

describe("state history, as Mantine's useStateHistory", () => {
  it("sets, steps back and forward, and drops the future on set", () => {
    const three = setHistory(setHistory(stateHistory(1), 2), 3)
    expect(three).toEqual({ history: [1, 2, 3], current: 2 })
    expect(currentOf(backHistory(three))).toBe(2)
    expect(currentOf(backHistory(three, 5))).toBe(1)
    expect(currentOf(forwardHistory(backHistory(three, 2)))).toBe(2)
    expect(setHistory(backHistory(three, 2), 9)).toEqual({ history: [1, 9], current: 1 })
  })

  it.prop(
    "stays within the history and returns after going back and forward",
    [Schema.Array(Schema.Int), steps],
    ([values, back]) => {
      const full = values.reduce(setHistory, stateHistory(0))
      const moved = backHistory(full, back)
      expect(moved.current).toBeGreaterThanOrEqual(0)
      expect(forwardHistory(moved, back)).toEqual(full)
      expect(currentOf(full)).toBe(values.at(-1) ?? 0)
    }
  )
})
