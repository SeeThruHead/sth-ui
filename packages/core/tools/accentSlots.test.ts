import { describe, expect, it } from "@effect/vitest"
import { mantinePalette } from "./mantinePalette.ts"
import { accentSlots } from "./accentSlots.ts"

const slots = (name: string) => new Map(accentSlots(name, mantinePalette[name] ?? []))

describe("accent slots, as Mantine derives a colour's variables", () => {
  it("fills with shade 6 in light and 8 in dark, hovering one shade darker", () => {
    expect(slots("red").get("filled")).toBe("light-dark(${palette.red6}, ${palette.red8})")
    expect(slots("red").get("filledHover")).toBe("light-dark(${palette.red7}, ${palette.red9})")
  })

  it("darkens shade 9 for light variants in dark and fades the outline hover", () => {
    expect(slots("red").get("light")).toBe("light-dark(${palette.red1}, rgba(101, 21, 21, 1))")
    expect(slots("red").get("lightHover")).toBe("light-dark(${palette.red2}, rgba(141, 29, 29, 1))")
    expect(slots("red").get("outlineHover")).toBe("light-dark(rgba(250, 82, 82, 0.05), rgba(255, 135, 135, 0.05))")
  })

  it("puts black text on light colours and white on dark ones", () => {
    expect(slots("yellow").get("contrast")).toBe("#000")
    expect(slots("blue").get("contrast")).toBe("#fff")
    expect(new Map(accentSlots("none", [])).get("contrast")).toBe("#fff")
  })
})
