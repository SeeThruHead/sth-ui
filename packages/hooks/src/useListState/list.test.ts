import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import {
  append,
  apply,
  applyWhere,
  filter,
  insert,
  pop,
  prepend,
  remove,
  reorder,
  setItem,
  setItemProp,
  shift,
  swap
} from "./list.ts"

const sorted = (list: ReadonlyArray<number>) => [...list].toSorted((a, b) => a - b)

const listWithIndices = Schema.Array(Schema.Int)
  .check(Schema.isMinLength(1))
  .pipe((schema) => Schema.Tuple([schema, Schema.Int, Schema.Int]))

describe("list state, as Mantine's useListState", () => {
  it("edits like Mantine's handlers", () => {
    const list = [1, 2, 3]
    expect(append(list, 4, 5)).toEqual([1, 2, 3, 4, 5])
    expect(prepend(list, 0)).toEqual([0, 1, 2, 3])
    expect(insert(list, 1, 9, 8)).toEqual([1, 9, 8, 2, 3])
    expect(pop(list)).toEqual([1, 2])
    expect(shift(list)).toEqual([2, 3])
    expect(apply(list, (item, index) => item * 10 + index)).toEqual([10, 21, 32])
    expect(
      applyWhere(
        list,
        (item) => item > 1,
        (item) => -item
      )
    ).toEqual([1, -2, -3])
    expect(remove(list, 0, 2)).toEqual([2])
    expect(reorder(list, { from: 0, to: 2 })).toEqual([2, 3, 1])
    expect(reorder(list, { from: 5, to: 0 })).toEqual(list)
    expect(swap(list, { from: 0, to: 2 })).toEqual([3, 2, 1])
    expect(setItem(list, 1, 7)).toEqual([1, 7, 3])
    expect(filter(list, (item) => item !== 2)).toEqual([1, 3])
    expect(
      setItemProp(
        [
          { a: 1, b: "x" },
          { a: 2, b: "z" }
        ],
        0,
        "b",
        "y"
      )
    ).toEqual([
      { a: 1, b: "y" },
      { a: 2, b: "z" }
    ])
  })

  it.prop("reorder and swap keep every item", [listWithIndices], ([[list, a, b]]) => {
    const from = Math.abs(a) % list.length
    const to = Math.abs(b) % list.length
    expect(sorted(reorder(list, { from, to }))).toEqual(sorted(list))
    expect(swap(swap(list, { from, to }), { from, to })).toEqual(list)
    expect(reorder(list, { from, to })[to]).toBe(list[from])
  })

  it.prop(
    "insert then remove gives the list back",
    [Schema.Array(Schema.Int), Schema.Int, Schema.Int],
    ([list, at, item]) => {
      const index = Math.abs(at) % (list.length + 1)
      expect(remove(insert(list, index, item), index)).toEqual(list)
    }
  )
})
