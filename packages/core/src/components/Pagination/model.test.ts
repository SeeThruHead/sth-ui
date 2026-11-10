import { describe, expect, it } from "@effect/vitest"
import { clampPage, firstPage, lastPage, paginationRange } from "./model.ts"

describe("Pagination model", () => {
  it("lists every page when they fit", () => {
    expect(paginationRange({ total: 7, active: 1 })).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(paginationRange({ total: 0, active: 1 })).toEqual([1])
  })

  it("puts dots on the side away from the active page", () => {
    expect(paginationRange({ total: 10, active: 1 })).toEqual([1, 2, 3, 4, 5, "dots", 10])
    expect(paginationRange({ total: 10, active: 10 })).toEqual([1, "dots", 6, 7, 8, 9, 10])
    expect(paginationRange({ total: 10, active: 5 })).toEqual([1, "dots", 4, 5, 6, "dots", 10])
  })

  it("follows siblings, boundaries and the start value", () => {
    expect(paginationRange({ total: 20, active: 10, siblings: 2 })).toEqual([1, "dots", 8, 9, 10, 11, 12, "dots", 20])
    expect(paginationRange({ total: 20, active: 10, boundaries: 2 })).toEqual([1, 2, "dots", 9, 10, 11, "dots", 19, 20])
    expect(paginationRange({ total: 15, active: 5, startValue: 5 })).toEqual([5, 6, 7, 8, 9, "dots", 15])
  })

  it("keeps pages inside the bounds", () => {
    expect(firstPage({ total: 10, startValue: -3 })).toBe(1)
    expect(lastPage({ total: 2, startValue: 5 })).toBe(5)
    expect(clampPage({ total: 10 }, 0)).toBe(1)
    expect(clampPage({ total: 10 }, 11)).toBe(10)
    expect(clampPage({ total: 10, startValue: 3 }, 4)).toBe(4)
  })
})
