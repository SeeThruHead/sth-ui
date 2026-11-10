import { describe, expect, it } from "vitest"
import { firstLine } from "./TestReport.ts"

const escape = String.fromCharCode(27)

describe("firstLine", () => {
  it("keeps the first line without terminal colours, at most 300 characters", () => {
    expect(
      firstLine(
        `Error: ${escape}[2mexpect(${escape}[22m${escape}[31mlocator${escape}[39m).toBeVisible() failed\n\nLocator: x`
      )
    ).toBe("Error: expect(locator).toBeVisible() failed")
    expect(firstLine("x".repeat(400))).toHaveLength(300)
  })
})
