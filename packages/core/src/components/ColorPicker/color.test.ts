import { describe, expect, it } from "@effect/vitest"
import {
  convertHsvaTo,
  hsvaToRgbaObject,
  isColorValid,
  luminance,
  parseColor,
  parseHex,
  parseHexa,
  parseHsla,
  parseHue,
  parseRgba,
  round,
  withAlpha
} from "./color.ts"

describe("parsing colours like Mantine", () => {
  it("reads hex, hexa, rgb, rgba, hsl and hsla", () => {
    expect(parseColor("#fff")).toEqual({ h: 0, s: 0, v: 100, a: 1 })
    expect(parseColor("#228be6")).toEqual({ h: 207.857, s: 85.217, v: 90.196, a: 1 })
    expect(parseHex("228be6")).toEqual(parseColor("#228be6"))
    expect(parseColor("#228be680")).toEqual({ h: 207.857, s: 85.217, v: 90.196, a: 0.502 })
    expect(parseHexa("#f008")).toEqual({ h: 0, s: 100, v: 100, a: 0.533 })
    expect(parseColor("rgb(34, 139, 230)")).toEqual(parseColor("#228be6"))
    expect(parseColor("rgba(0, 255, 0, 0.5)")).toEqual({ h: 120, s: 100, v: 100, a: 0.5 })
    expect(parseRgba("rgba(0%, 100%, 0%, 50%)")).toEqual({ h: 120, s: 100, v: 100, a: 0.5 })
    expect(parseColor("rgb(0, 0, 255)").h).toBe(240)
    expect(parseColor("rgb(255, 0, 128)").h).toBe(329.882)
    expect(parseColor("hsl(120, 100%, 50%)")).toEqual({ h: 120, s: 100, v: 100, a: 1 })
    expect(parseColor("hsla(0, 0%, 0%, 0.3)")).toEqual({ h: 0, s: 0, v: 0, a: 0.3 })
    expect(parseHsla("hsla(0.5turn 50% 75% / 40%)")).toMatchObject({ h: 180, v: 87.5, a: 0.4 })
    expect(parseHsla("hsla(0.5turn 50% 75% / 40%)").s).toBeCloseTo(28.571, 3)
    expect(parseHue("1", "rad")).toBeCloseTo(57.2958, 3)
    expect(parseColor("transparent")).toEqual({ h: 0, s: 0, v: 0, a: 0 })
    expect(parseColor("nonsense")).toEqual({ h: 0, s: 0, v: 0, a: 1 })
    expect(parseHsla("x")).toEqual({ h: 0, s: 0, v: 0, a: 1 })
    expect(parseRgba("x")).toEqual({ h: 0, s: 0, v: 0, a: 1 })
    expect(isColorValid("#abc")).toBe(true)
    expect(isColorValid("rgb(1, 2)")).toBe(false)
  })
})

describe("writing colours like Mantine", () => {
  const blue = parseColor("#228be6")

  it("converts to every format", () => {
    expect(convertHsvaTo("hex", blue)).toBe("#228be6")
    expect(convertHsvaTo("hexa", { ...blue, a: 0.5 })).toBe("#228be680")
    expect(convertHsvaTo("rgb", blue)).toBe("rgb(34, 139, 230)")
    expect(convertHsvaTo("rgba", { ...blue, a: 0.456 })).toBe("rgba(34, 139, 230, 0.46)")
    expect(convertHsvaTo("hsl", blue)).toBe("hsl(208, 80%, 52%)")
    expect(convertHsvaTo("hsla", { ...blue, a: 0.5 })).toBe("hsla(208, 80%, 52%, 0.5)")
    expect(convertHsvaTo("hsl", { h: 0, s: 0, v: 0, a: 1 })).toBe("hsl(0, 0%, 0%)")
    expect(convertHsvaTo("hsl", { h: 0, s: 0, v: 100, a: 1 })).toBe("hsl(0, 0%, 100%)")
    expect(convertHsvaTo("hsl", { h: 0, s: 50, v: 100, a: 1 })).toBe("hsl(0, 100%, 75%)")
    expect(convertHsvaTo("hsl", { h: 0, s: 100, v: 100, a: 1 })).toBe("hsl(0, 100%, 50%)")
    expect(hsvaToRgbaObject({ h: 360, s: 100, v: 100, a: 1 })).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(round(1.23456, 2)).toBe(1.23)
    expect(withAlpha("rgba")).toBe(true)
    expect(withAlpha("hex")).toBe(false)
  })

  it("measures luminance", () => {
    expect(luminance("#fff")).toBeCloseTo(1)
    expect(luminance("#000")).toBe(0)
    expect(luminance("#fa5252")).toBeCloseTo(0.2697, 3)
  })
})
