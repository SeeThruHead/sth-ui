import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { spinKey, typedSpin } from "./spin.ts"

const hours = { min: 0, max: 23, step: 1 }

describe("spin inputs, as Mantine's SpinInput", () => {
  it("reads typed digits, starting again when a digit would pass the max", () => {
    expect(typedSpin("1", hours)).toEqual(Option.some({ value: 1, advance: false }))
    expect(typedSpin("13", hours)).toEqual(Option.some({ value: 13, advance: true }))
    expect(typedSpin("5", hours)).toEqual(Option.some({ value: 5, advance: true }))
    expect(typedSpin("25", hours)).toEqual(Option.some({ value: 5, advance: true }))
    expect(typedSpin("00", hours)).toEqual(Option.some({ value: 0, advance: true }))
    expect(typedSpin("a", hours)).toEqual(Option.none())
    expect(typedSpin("0", { min: 1, max: 12, allowTemporaryZero: true })).toEqual(
      Option.some({ value: 0, advance: false })
    )
    expect(typedSpin("0", { min: 1, max: 12 })).toEqual(Option.some({ value: 1, advance: false }))
    expect(typedSpin("9", { min: 0, max: Number.POSITIVE_INFINITY })).toEqual(Option.some({ value: 9, advance: false }))
    expect(typedSpin("9", { min: 0, max: Number.POSITIVE_INFINITY, disableAutoAdvance: true })).toEqual(
      Option.some({ value: 9, advance: false })
    )
  })

  it("follows Mantine's keys", () => {
    expect(spinKey("Home", 5, hours)).toEqual(Option.some({ _tag: "Set", value: 0 }))
    expect(spinKey("End", 5, hours)).toEqual(Option.some({ _tag: "Set", value: 23 }))
    expect(spinKey("End", 5, { ...hours, max: Number.POSITIVE_INFINITY })).toEqual(Option.none())
    expect(spinKey("Backspace", 5, hours)).toEqual(Option.some({ _tag: "Set", value: null }))
    expect(spinKey("Delete", null, hours)).toEqual(Option.some({ _tag: "Previous" }))
    expect(spinKey("ArrowRight", 5, hours)).toEqual(Option.some({ _tag: "Next" }))
    expect(spinKey("ArrowLeft", 5, hours)).toEqual(Option.some({ _tag: "Previous" }))
    expect(spinKey("ArrowUp", null, hours)).toEqual(Option.some({ _tag: "Set", value: 0 }))
    expect(spinKey("ArrowUp", 23, hours)).toEqual(Option.some({ _tag: "Set", value: 23 }))
    expect(spinKey("ArrowUp", 50, { min: 0, max: 59, step: 15 })).toEqual(Option.some({ _tag: "Set", value: 45 }))
    expect(spinKey("ArrowDown", null, hours)).toEqual(Option.some({ _tag: "Set", value: 23 }))
    expect(spinKey("ArrowDown", null, { ...hours, max: Number.POSITIVE_INFINITY })).toEqual(
      Option.some({ _tag: "Set", value: 0 })
    )
    expect(spinKey("ArrowDown", 0, hours)).toEqual(Option.some({ _tag: "Set", value: 0 }))
    expect(spinKey("0", 0, hours)).toEqual(Option.some({ _tag: "Next" }))
    expect(spinKey("0", 0, hours, true)).toEqual(Option.none())
    expect(spinKey("x", 0, hours)).toEqual(Option.none())
  })
})
