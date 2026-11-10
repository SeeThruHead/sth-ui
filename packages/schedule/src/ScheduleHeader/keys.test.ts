import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { tabTarget } from "./keys.ts"

describe("view tabs keyboard, as ViewSelect", () => {
  it("moves between tabs, wrapping, and mirrors in right to left", () => {
    expect(tabTarget("ArrowRight", 3, 4, false)).toEqual(Option.some(0))
    expect(tabTarget("ArrowLeft", 0, 4, false)).toEqual(Option.some(3))
    expect(tabTarget("ArrowLeft", 1, 4, true)).toEqual(Option.some(2))
    expect(tabTarget("ArrowRight", 1, 4, true)).toEqual(Option.some(0))
    expect(tabTarget("Home", 2, 4, false)).toEqual(Option.some(0))
    expect(tabTarget("End", 0, 4, false)).toEqual(Option.some(3))
    expect(tabTarget("Enter", 0, 4, false)).toEqual(Option.none())
  })
})
