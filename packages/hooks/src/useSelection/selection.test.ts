import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { deselect, isAllSelected, isSomeSelected, select, setSelection, toggle } from "./selection.ts"

const sorted = (list: ReadonlyArray<number>) => [...list].toSorted((a, b) => a - b)

describe("selection, as Mantine's useSelection", () => {
  it("selects, deselects and toggles", () => {
    expect(select([1], 2)).toEqual([1, 2])
    expect(select([1, 2], 2)).toEqual([1, 2])
    expect(deselect([1, 2], 1)).toEqual([2])
    expect(toggle([1, 2], 1)).toEqual([2])
    expect(toggle([2], 1)).toEqual([2, 1])
    expect(setSelection([3, 3, 1])).toEqual([3, 1])
    expect(isAllSelected([], [])).toBe(false)
    expect(isAllSelected([1, 2], [2, 1])).toBe(true)
    expect(isAllSelected([1, 2], [2])).toBe(false)
    expect(isSomeSelected([1, 2], [2])).toBe(true)
    expect(isSomeSelected([1, 2], [])).toBe(false)
  })

  it.prop(
    "toggling twice changes nothing and select is idempotent",
    [Schema.Array(Schema.Int), Schema.Int],
    ([items, raw]) => {
      const item = raw === 0 ? 0 : raw
      const selection = setSelection(items.map((value) => (value === 0 ? 0 : value)))
      expect(sorted(toggle(toggle(selection, item), item))).toEqual(sorted(selection))
      expect(select(select(selection, item), item)).toEqual(select(selection, item))
      expect(deselect(select(selection, item), item)).not.toContain(item)
    }
  )
})
