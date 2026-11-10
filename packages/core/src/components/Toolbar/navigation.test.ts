import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { nextIndex, toggledMultiple, toggledSingle } from "./navigation.ts"

const base = { current: 1, count: 3, orientation: "horizontal" as const, loop: true, rtl: false }

describe("Toolbar navigation", () => {
  it("moves along the orientation and wraps when looping", () => {
    expect(nextIndex({ ...base, key: "ArrowRight" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, key: "ArrowLeft" })).toEqual(Option.some(0))
    expect(nextIndex({ ...base, current: 2, key: "ArrowRight" })).toEqual(Option.some(0))
    expect(nextIndex({ ...base, current: 0, key: "ArrowLeft" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, key: "ArrowDown" })).toEqual(Option.none())
    expect(nextIndex({ ...base, orientation: "vertical", key: "ArrowDown" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, orientation: "vertical", key: "ArrowUp" })).toEqual(Option.some(0))
    expect(nextIndex({ ...base, orientation: "vertical", key: "ArrowRight" })).toEqual(Option.none())
  })

  it("reverses for right-to-left and stops at the ends without looping", () => {
    expect(nextIndex({ ...base, rtl: true, key: "ArrowLeft" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, rtl: true, key: "ArrowRight" })).toEqual(Option.some(0))
    expect(nextIndex({ ...base, loop: false, current: 2, key: "ArrowRight" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, loop: false, current: 0, key: "ArrowLeft" })).toEqual(Option.some(0))
  })

  it("jumps with Home and End and ignores focus outside the items", () => {
    expect(nextIndex({ ...base, key: "Home" })).toEqual(Option.some(0))
    expect(nextIndex({ ...base, key: "End" })).toEqual(Option.some(2))
    expect(nextIndex({ ...base, key: "Enter" })).toEqual(Option.none())
    expect(nextIndex({ ...base, current: -1, key: "ArrowRight" })).toEqual(Option.none())
    expect(nextIndex({ ...base, count: 0, key: "ArrowRight" })).toEqual(Option.none())
  })

  it("toggles single and multiple values", () => {
    expect(toggledSingle("left", "left")).toBeNull()
    expect(toggledSingle("left", "right")).toBe("right")
    expect(toggledSingle(null, "left")).toBe("left")
    expect(toggledMultiple(["bold"], "bold")).toEqual([])
    expect(toggledMultiple(["bold"], "italic")).toEqual(["bold", "italic"])
  })
})
