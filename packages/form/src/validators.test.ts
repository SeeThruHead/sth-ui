import { describe, expect, it } from "@effect/vitest"
import {
  hasLength,
  isEmail,
  isInRange,
  isJSONString,
  isNotEmpty,
  isNotEmptyHTML,
  isOneOf,
  isUrl,
  matches,
  matchesField
} from "./validators.ts"

const check = (
  rule: (value: unknown, values: unknown, path: string) => unknown,
  value: unknown,
  values: unknown = {}
) => rule(value, values, "field")

describe("form validators, as @mantine/form's", () => {
  it("checks emptiness", () => {
    expect(check(isNotEmpty("Required"), "  ")).toBe("Required")
    expect(check(isNotEmpty(), "a")).toBe(null)
    expect(check(isNotEmpty(), [])).toBe(true)
    expect(check(isNotEmpty(), [1])).toBe(null)
    expect(check(isNotEmpty(), null)).toBe(true)
    expect(check(isNotEmpty(), false)).toBe(true)
    expect(check(isNotEmpty(""), 0)).toBe(null)
    expect(check(isNotEmptyHTML(), "<p> </p>")).toBe(true)
    expect(check(isNotEmptyHTML(), "<p>Hi</p>")).toBe(null)
    expect(check(isNotEmptyHTML(), 1)).toBe(true)
  })

  it("checks length", () => {
    expect(check(hasLength(3), " abc ")).toBe(null)
    expect(check(hasLength(3), "ab")).toBe(true)
    expect(check(hasLength({ min: 2, max: 4 }), [1, 2, 3])).toBe(null)
    expect(check(hasLength({ max: 2 }), [1, 2, 3])).toBe(true)
    expect(check(hasLength({ min: 2 }), "a")).toBe(true)
    expect(check(hasLength({}), "a")).toBe(null)
    expect(check(hasLength(1), { length: "x" })).toBe(true)
    expect(check(hasLength(1), 5)).toBe(true)
  })

  it("checks patterns, emails, ranges and JSON", () => {
    expect(check(matches(/^a/), "abc")).toBe(null)
    expect(check(matches(/^a/), 5)).toBe(true)
    expect(check(isEmail("Invalid email"), "a@b.co")).toBe(null)
    expect(check(isEmail("Invalid email"), "a@b")).toBe("Invalid email")
    expect(check(isInRange({ min: 1, max: 3 }), 2)).toBe(null)
    expect(check(isInRange({ min: 1 }), 0)).toBe(true)
    expect(check(isInRange({ max: 1 }), 2)).toBe(true)
    expect(check(isInRange({}), "2")).toBe(true)
    expect(check(isJSONString(), '{"a":1}')).toBe(null)
    expect(check(isJSONString(), "{")).toBe(true)
    expect(check(isJSONString(), 1)).toBe(true)
  })

  it("checks choices, URLs and matching fields", () => {
    expect(check(isOneOf(["a", "b"]), "a")).toBe(null)
    expect(check(isOneOf(["a", "b"]), "c")).toBe(true)
    expect(check(isUrl(), "https://mantine.dev")).toBe(null)
    expect(check(isUrl(), "ftp://mantine.dev")).toBe(true)
    expect(check(isUrl(), "http://localhost:3000")).toBe(true)
    expect(check(isUrl({ allowLocalhost: true, protocols: ["http"] }), "http://localhost:3000")).toBe(null)
    expect(check(isUrl(), "not a url")).toBe(true)
    expect(check(isUrl(), 1)).toBe(true)
    expect(check(matchesField("password"), "x", { password: "x" })).toBe(null)
    expect(check(matchesField("password"), "y", { password: "x" })).toBe(true)
    expect(check(matchesField("password"), "x", {})).toBe(true)
    expect(check(matchesField("password"), "x", null)).toBe(true)
  })
})
