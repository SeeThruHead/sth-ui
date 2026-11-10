import { describe, expect, it } from "@effect/vitest"
import { getInitials, getInitialsColor } from "./initials.ts"

describe("Avatar initials", () => {
  it("takes the first letter of the first two words, as Mantine does", () => {
    expect(getInitials("John Doe")).toBe("JD")
    expect(getInitials("Sarah Ann Condor")).toBe("SA")
    expect(getInitials("Sarah Ann Condor", 3)).toBe("SAC")
  })

  it("takes the first letters of a single word", () => {
    expect(getInitials("vitaly")).toBe("VI")
  })

  it("picks the same colour as Mantine's hash for each name", () => {
    expect(
      ["John Doe", "Jane Mol", "Alex Lump", "Sarah Condor", "Mike Johnson", "Kate Kok", "Tom Smith"].map((name) =>
        getInitialsColor(name)
      )
    ).toEqual(["lime", "lime", "pink", "lime", "orange", "lime", "blue"])
  })

  it("chooses only from the colours given, and gray when there are none", () => {
    expect(getInitialsColor("John Doe", ["red", "blue"])).toMatch(/^(red|blue)$/)
    expect(getInitialsColor("John Doe", [])).toBe("gray")
  })
})
