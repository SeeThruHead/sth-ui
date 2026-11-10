import { describe, expect, it } from "@effect/vitest"
import { isAllowedCheck, nextText, refusesInput, valuesOf } from "./numberRules.ts"

const rules = { allowNegative: false, allowDecimal: true, decimalScale: 2, separator: "." }

describe("NumberInput rules, as Mantine's", () => {
  it("refuses signs, separators and long fractions from the text the key would make", () => {
    expect(refusesInput(rules, "1", 1, 1, "-")).toBe(true)
    expect(refusesInput({ ...rules, allowDecimal: false }, "1", 1, 1, ".")).toBe(true)
    expect(refusesInput(rules, "1.25", 4, 4, "5")).toBe(true)
    expect(refusesInput(rules, "1.25", 0, 0, "5")).toBe(false)
    expect(refusesInput({ ...rules, decimalScale: -1 }, "1.2555", 6, 6, "5")).toBe(false)
    expect(refusesInput(rules, "1", 1, 1, "2")).toBe(false)
    expect(nextText("12", 1, 1, "x")).toBe("1x2")
  })

  it("reads values for isAllowed", () => {
    expect(valuesOf("1,5", ",")).toEqual({ value: "1.5", floatValue: 1.5 })
    expect(valuesOf("", ".")).toEqual({ value: "", floatValue: undefined })
    expect(valuesOf("-", ".")).toEqual({ value: "-", floatValue: undefined })
    expect(isAllowedCheck(() => true)).toBe(true)
    expect(isAllowedCheck("x")).toBe(false)
  })
})
