import { describe, expect, it } from "@effect/vitest"
import { Schema } from "effect"
import { applyConstraints } from "../useSplitter/splitter.ts"
import { formatMask, isMaskComplete, unformatMask } from "../useMask/mask.ts"
import { nextPage, paginationRange, previousPage, toFirstPage, toLastPage } from "./pagination.ts"

const small = (max: number) => Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: max }))

describe("pagination, as Mantine's usePagination", () => {
  it("steps within the pages", () => {
    const bounds = { total: 10 }
    expect(nextPage(bounds, 3)).toBe(4)
    expect(nextPage(bounds, 10)).toBe(10)
    expect(previousPage(bounds, 1)).toBe(1)
    expect(previousPage({ total: 10, startValue: 5 }, 6)).toBe(5)
    expect(toFirstPage({ total: 10, startValue: 3 })).toBe(3)
    expect(toLastPage(bounds)).toBe(10)
  })

  it.prop(
    "always shows the active page, and the first and last with boundaries, in order with no two dots together",
    [small(60), small(60), small(3), small(3)],
    ([total, at, siblings, boundaries]) => {
      const last = Math.max(total, 1)
      const active = (at % last) + 1
      const range = paginationRange({ total, active, siblings, boundaries })
      const pages = range.filter((item): item is number => item !== "dots")
      expect(pages).toContain(active)
      expect(boundaries === 0 || (pages.includes(1) && pages.includes(last))).toBe(true)
      expect(pages).toEqual([...pages].toSorted((a, b) => a - b))
      expect(range.some((item, index) => item === "dots" && range[index + 1] === "dots")).toBe(false)
      expect(range.length).toBeLessThanOrEqual(Math.max(siblings * 2 + 3 + boundaries * 2, last))
    }
  )
})

describe("mask, as Mantine's useMask", () => {
  it.prop(
    "formats digits into the mask and reads them back",
    [Schema.String.check(Schema.isPattern(/^\d{0,8}$/))],
    ([digits]) => {
      const options = { mask: "(999) 999" }
      const masked = formatMask(digits, options)
      expect(unformatMask(masked, options)).toBe(digits.slice(0, 6))
      expect(isMaskComplete(masked, options)).toBe(digits.length >= 6)
    }
  )
})

describe("splitter, as Mantine's useSplitter", () => {
  const free = { defaultSize: 0, min: 0, max: 100, collapsible: false, collapseThreshold: 0 }

  it.prop(
    "moving a handle keeps the total and every pane within its limits",
    [small(100), Schema.Int.check(Schema.isBetween({ minimum: -100, maximum: 100 }))],
    ([first, delta]) => {
      const sizes = [first, (100 - first) / 2, (100 - first) / 2]
      const moved = applyConstraints(sizes, [free, free, free], 0, delta, "nearest")
      expect(moved.reduce((sum, size) => sum + size, 0)).toBeCloseTo(100)
      expect(moved.every((size) => size >= 0 && size <= 100)).toBe(true)
    }
  )
})
