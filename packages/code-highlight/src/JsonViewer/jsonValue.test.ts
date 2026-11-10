import { describe, expect, it } from "@effect/vitest"
import {
  arrayChunks,
  chunkSegment,
  displayValue,
  entriesOf,
  expandablePaths,
  formatValue,
  isExpandable,
  pathSeparator,
  safeStringify,
  serializePath,
  typeLabel,
  valueType
} from "./jsonValue.ts"

const path = (...segments: ReadonlyArray<string>) => serializePath(segments)

describe("json values, as Mantine's json-viewer-utils", () => {
  it("joins paths with a separator no key can hold", () => {
    expect(serializePath(["a", "b"])).toBe(`a${pathSeparator}b`)
    expect(serializePath([])).toBe("")
  })

  it("groups long arrays into chunks", () => {
    expect(arrayChunks(10, false)).toBeNull()
    expect(arrayChunks(3, 5)).toBeNull()
    expect(arrayChunks(10, 0)).toBeNull()
    expect(arrayChunks(7, 3)).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
      { start: 6, end: 6 }
    ])
    expect(chunkSegment({ start: 0, end: 2 })).toBe("[0...2]")
  })

  it("shows what toJSON gives, falling back when it throws", () => {
    expect(displayValue({ toJSON: () => "x" })).toBe("x")
    const broken = {
      toJSON: () => {
        throw new Error("no")
      }
    }
    expect(displayValue(broken)).toBe(broken)
    expect(displayValue(3)).toBe(3)
    expect(isExpandable(null)).toBe(false)
    expect(isExpandable([])).toBe(true)
  })

  it("lists entries, sorting keys when asked", () => {
    expect(entriesOf(["a", "b"])).toEqual([
      ["0", "a"],
      ["1", "b"]
    ])
    expect(entriesOf({ b: 1, a: 2 })).toEqual([
      ["b", 1],
      ["a", 2]
    ])
    expect(entriesOf({ b: 1, a: 2 }, true)).toEqual([
      ["a", 2],
      ["b", 1]
    ])
    expect(entriesOf({ b: 1, a: 2, c: 3 }, (a, b) => b.localeCompare(a)).map(([key]) => key)).toEqual(["c", "b", "a"])
  })

  it("finds the expandable paths to a depth, through chunks and past cycles", () => {
    const value = { user: { name: "a", tags: ["x"] }, empty: {}, list: [1, 2, 3, 4] }
    expect(expandablePaths(value)).toEqual([path("user"), path("user", "tags"), path("list")])
    expect(expandablePaths(value, { depth: 1 })).toEqual([])
    expect(expandablePaths(value, { depth: 2 })).toEqual([path("user"), path("list")])
    expect(expandablePaths(value, { groupArraysAfterLength: 2 })).toEqual([
      path("user"),
      path("user", "tags"),
      path("list"),
      path("list", "[0...1]"),
      path("list", "[2...3]")
    ])
    expect(expandablePaths({ list: [[1], [2], [3]] }, { groupArraysAfterLength: 2, depth: 2 })).toEqual([path("list")])
    const cyclic: Record<string, unknown> = { a: 1 }
    Reflect.set(cyclic, "self", cyclic)
    expect(expandablePaths(cyclic)).toEqual([])
    expect(expandablePaths(5)).toEqual([])
  })

  it("names value types and labels", () => {
    expect(valueType(null)).toBe("null")
    expect(valueType([])).toBe("array")
    expect(valueType("a")).toBe("string")
    expect(typeLabel(1)).toBe("int")
    expect(typeLabel(1.5)).toBe("float")
    expect(typeLabel(true)).toBe("bool")
    expect(typeLabel("a")).toBe("string")
    expect(typeLabel(undefined)).toBe("undefined")
    expect(typeLabel({})).toBe("object")
  })

  it("formats values, collapsing long strings without splitting a pair", () => {
    expect(formatValue(null, true, false)).toEqual({ display: "null", collapsed: false })
    expect(formatValue(undefined, true, false).display).toBe("undefined")
    expect(formatValue(2, true, false).display).toBe("2")
    expect(formatValue("hi", true, false).display).toBe('"hi"')
    expect(formatValue("hi", false, false).display).toBe("hi")
    expect(formatValue("hello world", true, 5)).toEqual({ display: '"hello..."', collapsed: true })
    expect(formatValue("hello world", false, 5)).toEqual({ display: "hello...", collapsed: true })
    expect(formatValue("abc😀def", false, 4).display).toBe("abc...")
    expect(formatValue("abc", false, 5).collapsed).toBe(false)
  })

  it("stringifies with cycles and bigints", () => {
    const cyclic: Record<string, unknown> = { a: 1n, list: [{ toJSON: () => "t" }] }
    Reflect.set(cyclic, "self", cyclic)
    expect(safeStringify(cyclic)).toBe('{\n  "a": "1",\n  "list": [\n    "t"\n  ],\n  "self": "[Circular]"\n}')
    expect(safeStringify(undefined)).toBe("undefined")
  })
})
