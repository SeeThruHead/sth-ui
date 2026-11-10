import { describe, expect, it } from "@effect/vitest"
import { formatNumber, numericString } from "./format.ts"

describe("formatNumber, as react-number-format's NumericFormat text", () => {
  it("groups thousands in every style", () => {
    expect(formatNumber(1000000)).toBe("1000000")
    expect(formatNumber(1000000, { thousandSeparator: true })).toBe("1,000,000")
    expect(formatNumber(1000000, { thousandSeparator: "." })).toBe("1.000.000")
    expect(formatNumber(1000000, { thousandSeparator: true, thousandsGroupStyle: "lakh" })).toBe("10,00,000")
    expect(formatNumber(100000000, { thousandSeparator: true, thousandsGroupStyle: "wan" })).toBe("1,0000,0000")
    expect(formatNumber(1000000, { thousandSeparator: true, thousandsGroupStyle: "none" })).toBe("1000000")
    expect(formatNumber(1000000, { thousandSeparator: false })).toBe("1000000")
  })

  it("adds affixes and keeps the sign first", () => {
    expect(formatNumber(1000000, { prefix: "$ ", thousandSeparator: true })).toBe("$ 1,000,000")
    expect(formatNumber(100, { suffix: " RUB" })).toBe("100 RUB")
    expect(formatNumber(-1234.5, { prefix: "$", thousandSeparator: true })).toBe("-$1,234.5")
    expect(formatNumber(-1234.5, { allowNegative: false })).toBe("1234.5")
  })

  it("rounds numbers and cuts strings to the decimal scale", () => {
    expect(formatNumber(5 / 3, { decimalScale: 2 })).toBe("1.67")
    expect(formatNumber(1.5, { decimalScale: 0 })).toBe("2")
    expect(formatNumber(9.999, { decimalScale: 2 })).toBe("10.00")
    expect(formatNumber(1, { decimalScale: 2, fixedDecimalScale: true })).toBe("1.00")
    expect(formatNumber(1.5, { decimalScale: 3 })).toBe("1.5")
    expect(formatNumber("1234.567", { decimalScale: 2 })).toBe("1234.56")
    expect(formatNumber("1,234.5", { thousandSeparator: true })).toBe("1,234.5")
    expect(formatNumber(".5")).toBe(".5".replace(".", "0."))
    expect(formatNumber(1000000.5, { thousandSeparator: ".", decimalSeparator: "," })).toBe("1.000.000,5")
  })

  it("writes small and large numbers without exponents", () => {
    expect(numericString(1e21)).toBe("1000000000000000000000")
    expect(numericString(1.5e21)).toBe("1500000000000000000000")
    expect(numericString(1e-7)).toBe("0.0000001")
    expect(numericString(-1.25e-7)).toBe("-0.000000125")
    expect(numericString(1.2345e22)).toBe("12345000000000000000000")
    expect(numericString(42)).toBe("42")
    expect(formatNumber(1e21, { thousandSeparator: true })).toBe("1,000,000,000,000,000,000,000")
  })
})
