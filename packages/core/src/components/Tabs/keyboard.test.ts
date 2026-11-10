import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { stepOf, targetIndex } from "./keyboard.ts"

const tabs = (...disabled: ReadonlyArray<boolean>) => disabled.map((off) => ({ disabled: off }))

describe("Tabs keyboard", () => {
  it("reads the arrows that follow the orientation and direction, and Home and End", () => {
    expect(stepOf("ArrowRight", "horizontal", false)).toEqual(Option.some("next"))
    expect(stepOf("ArrowLeft", "horizontal", false)).toEqual(Option.some("previous"))
    expect(stepOf("ArrowRight", "horizontal", true)).toEqual(Option.some("previous"))
    expect(stepOf("ArrowLeft", "horizontal", true)).toEqual(Option.some("next"))
    expect(stepOf("ArrowDown", "vertical", false)).toEqual(Option.some("next"))
    expect(stepOf("ArrowUp", "vertical", true)).toEqual(Option.some("previous"))
    expect(stepOf("Home", "vertical", false)).toEqual(Option.some("first"))
    expect(stepOf("End", "horizontal", false)).toEqual(Option.some("last"))
  })

  it("ignores arrows across the orientation and other keys", () => {
    expect(stepOf("ArrowDown", "horizontal", false)).toEqual(Option.none())
    expect(stepOf("ArrowRight", "vertical", false)).toEqual(Option.none())
    expect(stepOf("a", "horizontal", false)).toEqual(Option.none())
  })

  it("skips disabled tabs and loops past the ends", () => {
    const row = tabs(false, true, false, false)
    expect(targetIndex(row, 0, "next", true)).toEqual(Option.some(2))
    expect(targetIndex(row, 3, "next", true)).toEqual(Option.some(0))
    expect(targetIndex(row, 2, "previous", true)).toEqual(Option.some(0))
    expect(targetIndex(row, 0, "previous", true)).toEqual(Option.some(3))
  })

  it("stays put at the ends without loop", () => {
    const row = tabs(false, false, false)
    expect(targetIndex(row, 2, "next", false)).toEqual(Option.some(2))
    expect(targetIndex(row, 0, "previous", false)).toEqual(Option.some(0))
  })

  it("goes to the first and last enabled tab", () => {
    const row = tabs(true, false, false, true)
    expect(targetIndex(row, 2, "first", true)).toEqual(Option.some(1))
    expect(targetIndex(row, 1, "last", true)).toEqual(Option.some(2))
    expect(targetIndex(tabs(true, true), 0, "first", true)).toEqual(Option.none())
    expect(targetIndex(tabs(true, true), 0, "last", true)).toEqual(Option.none())
  })

  it("stays on the current tab when every other one is disabled", () => {
    expect(targetIndex(tabs(false, true), 0, "next", true)).toEqual(Option.some(0))
    expect(targetIndex(tabs(false, true), 0, "previous", true)).toEqual(Option.some(0))
  })
})
