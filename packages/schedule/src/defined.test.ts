import { describe, expect, it } from "@effect/vitest"
import { defined } from "./defined.ts"

describe("defined", () => {
  it("drops undefined entries", () => {
    expect(defined({ a: 1, b: undefined, c: "x" })).toEqual({ a: 1, c: "x" })
  })
})
