import { describe, expect, it } from "@effect/vitest"
import { changeIndices, clearListState, reorderKeys } from "./lists.ts"

const errors = {
  name: "name-error",
  "fruits.0.name": "fruit-error-1",
  "fruits.4.available": "fruit-error-3",
  "fruits.15.inner.0.name": "fruit-error-5",
  "nested.0.inner.1.name": "nested-error-1",
  "nested.0.inner.2.name": "nested-error-2",
  "nested.0.inner.5.check": "nested-error-4"
}

describe("form list state, as @mantine/form's", () => {
  it("shifts indices up after an insert", () => {
    expect(changeIndices("fruits", 4, errors, 1)).toEqual({
      name: "name-error",
      "fruits.0.name": "fruit-error-1",
      "fruits.5.available": "fruit-error-3",
      "fruits.16.inner.0.name": "fruit-error-5",
      "nested.0.inner.1.name": "nested-error-1",
      "nested.0.inner.2.name": "nested-error-2",
      "nested.0.inner.5.check": "nested-error-4"
    })
  })

  it("drops the removed item's state and shifts the rest down", () => {
    expect(changeIndices("nested.0.inner", 2, errors, -1)).toEqual({
      name: "name-error",
      "fruits.0.name": "fruit-error-1",
      "fruits.4.available": "fruit-error-3",
      "fruits.15.inner.0.name": "fruit-error-5",
      "nested.0.inner.1.name": "nested-error-1",
      "nested.0.inner.4.check": "nested-error-4"
    })
    expect(changeIndices("fruits", 0, { "fruits.0": "a", "fruits.1": "b", "fruits.x": "c" }, -1)).toEqual({
      "fruits.0": "b",
      "fruits.x": "c"
    })
    expect(changeIndices("fruits", undefined, errors, 1)).toBe(errors)
  })

  it("swaps the state of reordered items and clears a list's state", () => {
    expect(reorderKeys("a", { from: 2, to: 0 }, { "a.0": true })).toEqual({ "a.2": true })
    expect(reorderKeys("a", { from: 2, to: 0 }, { "a.0": true, "a.2": "Error", "a.2.b": 1, b: 2 })).toEqual({
      "a.2": true,
      "a.0": "Error",
      "a.0.b": 1,
      b: 2
    })
    expect(clearListState("fruits", errors)).toEqual({
      name: "name-error",
      "nested.0.inner.1.name": "nested-error-1",
      "nested.0.inner.2.name": "nested-error-2",
      "nested.0.inner.5.check": "nested-error-4"
    })
  })
})
