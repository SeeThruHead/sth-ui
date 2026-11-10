import { describe, expect, it } from "@effect/vitest"
import { alpha, darken, isLightColor, luminance } from "./color.ts"

describe("luminance of a hex colour", () => {
  it("measures long and short hex", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1)
    expect(luminance("#fff")).toBeCloseTo(1)
    expect(luminance("#000000")).toBe(0)
    expect(luminance("#fa5252")).toBeCloseTo(0.2697, 3)
  })

  it("tells light colours from dark at Mantine's threshold", () => {
    expect(isLightColor("#ffd43b", 0.3)).toBe(true)
    expect(isLightColor("#1864ab", 0.3)).toBe(false)
  })
})

describe("Mantine's colour functions", () => {
  it("darkens towards black, rounding each channel", () => {
    expect(darken("#212529", 0.5)).toBe("rgba(17, 19, 21, 1)")
    expect(darken("#fff", 0.3)).toBe("rgba(179, 179, 179, 1)")
  })

  it("fades with an alpha", () => {
    expect(alpha("#228be6", 0.05)).toBe("rgba(34, 139, 230, 0.05)")
  })
})
