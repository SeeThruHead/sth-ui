import { describe, expect, it } from "@effect/vitest"
import { compareValues, filterIsActive, matchesFilter, matchesSearch, nextSort, queryRows, rowWindow } from "./rows.ts"
import type { ColumnData, FilterValue } from "./rows.ts"

type Game = {
  readonly id: string
  readonly title: string
  readonly system: string
  readonly regions: ReadonlyArray<string>
  readonly rating: number | null
  readonly added: string
  readonly verified: boolean
}

const games: ReadonlyArray<Game> = [
  { id: "a", title: "Tetris", system: "gb", regions: ["eu", "us"], rating: 4.5, added: "2024-03-01", verified: true },
  { id: "b", title: "Pokémon Red", system: "gb", regions: ["jp"], rating: null, added: "2023-11-20", verified: false },
  { id: "c", title: "Zelda 2", system: "nes", regions: ["us"], rating: 3, added: "2025-01-05", verified: true },
  { id: "d", title: "Zelda 10", system: "snes", regions: [], rating: 5, added: "", verified: true }
]

const columns: ReadonlyArray<ColumnData<Game>> = [
  { id: "title", value: (game) => game.title, sortable: true, filter: { _tag: "Text" } },
  { id: "system", value: (game) => game.system, filter: { _tag: "Options", options: [] } },
  { id: "region", value: (game) => game.regions, filter: { _tag: "Options", options: [] } },
  { id: "rating", value: (game) => game.rating, filter: { _tag: "NumberRange" } },
  { id: "added", value: (game) => game.added, filter: { _tag: "DateRange" } },
  { id: "verified", value: (game) => game.verified, filter: { _tag: "Boolean" } },
  { id: "cover" }
]

const ids = (rows: ReadonlyArray<Game>) => rows.map((game) => game.id)

const none = { sort: null, search: "", filters: {} }

describe("data table rows", () => {
  it("tells when a filter narrows anything", () => {
    expect(filterIsActive({ _tag: "Text", query: "  " })).toBe(false)
    expect(filterIsActive({ _tag: "Text", query: "z" })).toBe(true)
    expect(filterIsActive({ _tag: "Options", values: [] })).toBe(false)
    expect(filterIsActive({ _tag: "Options", values: ["gb"] })).toBe(true)
    expect(filterIsActive({ _tag: "NumberRange", min: null, max: null })).toBe(false)
    expect(filterIsActive({ _tag: "NumberRange", min: null, max: 3 })).toBe(true)
    expect(filterIsActive({ _tag: "DateRange", from: null, to: null })).toBe(false)
    expect(filterIsActive({ _tag: "DateRange", from: "2024-01-01", to: null })).toBe(true)
    expect(filterIsActive({ _tag: "Boolean", value: false })).toBe(true)
  })

  it("matches text, options, ranges and booleans", () => {
    expect(matchesFilter("Pokémon Red", { _tag: "Text", query: "pokemon" })).toBe(true)
    expect(matchesFilter(null, { _tag: "Text", query: "x" })).toBe(false)
    expect(matchesFilter(["eu", "us"], { _tag: "Options", values: ["us", "jp"] })).toBe(true)
    expect(matchesFilter("gb", { _tag: "Options", values: ["nes"] })).toBe(false)
    expect(matchesFilter(undefined, { _tag: "Options", values: ["nes"] })).toBe(false)
    expect(matchesFilter(4, { _tag: "NumberRange", min: 3, max: 5 })).toBe(true)
    expect(matchesFilter(2, { _tag: "NumberRange", min: 3, max: null })).toBe(false)
    expect(matchesFilter(6, { _tag: "NumberRange", min: null, max: 5 })).toBe(false)
    expect(matchesFilter(null, { _tag: "NumberRange", min: 1, max: null })).toBe(false)
    expect(matchesFilter("2024-03-01T10:00:00Z", { _tag: "DateRange", from: "2024-01-01", to: "2024-12-31" })).toBe(
      true
    )
    expect(matchesFilter(20200102, { _tag: "DateRange", from: "2021-01-01", to: null })).toBe(false)
    expect(matchesFilter("", { _tag: "DateRange", from: "2021-01-01", to: null })).toBe(false)
    expect(matchesFilter(true, { _tag: "DateRange", from: "2021-01-01", to: null })).toBe(false)
    expect(matchesFilter(true, { _tag: "Boolean", value: true })).toBe(true)
    expect(matchesFilter(false, { _tag: "Boolean", value: true })).toBe(false)
    expect(matchesFilter(undefined, { _tag: "Text", query: "" })).toBe(true)
  })

  it("searches every word, ignoring case and accents", () => {
    expect(matchesSearch("Pokémon Red Version", "red POKEMON")).toBe(true)
    expect(matchesSearch("Pokémon Red Version", "blue")).toBe(false)
    expect(matchesSearch("anything", "  ")).toBe(true)
  })

  it("sorts naturally and keeps empty values last both ways", () => {
    expect(compareValues("Zelda 2", "Zelda 10", "asc")).toBeLessThan(0)
    expect(compareValues("Zelda 2", "Zelda 10", "desc")).toBeGreaterThan(0)
    expect(compareValues(1, 2, "asc")).toBeLessThan(0)
    expect(compareValues(false, true, "asc")).toBeLessThan(0)
    expect(compareValues(true, 1, "asc")).toBeLessThan(0)
    expect(compareValues(["b"], ["a", "z"], "asc")).toBeGreaterThan(0)
    expect(compareValues(null, 1, "asc")).toBe(1)
    expect(compareValues(null, 1, "desc")).toBe(1)
    expect(compareValues(1, undefined, "desc")).toBe(-1)
    expect(compareValues(null, "", "asc")).toBe(0)
  })

  it("filters, searches and sorts rows", () => {
    expect(ids(queryRows(none, games, columns))).toEqual(["a", "b", "c", "d"])
    expect(ids(queryRows({ ...none, sort: { column: "title", direction: "asc" } }, games, columns))).toEqual([
      "b",
      "a",
      "c",
      "d"
    ])
    expect(ids(queryRows({ ...none, sort: { column: "rating", direction: "desc" } }, games, columns))).toEqual([
      "d",
      "a",
      "c",
      "b"
    ])
    expect(ids(queryRows({ ...none, sort: { column: "missing", direction: "asc" } }, games, columns))).toEqual([
      "a",
      "b",
      "c",
      "d"
    ])
    expect(ids(queryRows({ ...none, sort: { column: "cover", direction: "asc" } }, games, columns))).toEqual([
      "a",
      "b",
      "c",
      "d"
    ])
    expect(ids(queryRows({ ...none, search: "zelda" }, games, columns, (game) => game.title))).toEqual(["c", "d"])
    expect(ids(queryRows({ ...none, search: "zelda" }, games, columns))).toEqual(["a", "b", "c", "d"])
    const filters: Readonly<Record<string, FilterValue>> = {
      region: { _tag: "Options", values: ["us"] },
      verified: { _tag: "Boolean", value: true }
    }
    expect(ids(queryRows({ ...none, filters }, games, columns))).toEqual(["a", "c"])
    expect(ids(queryRows({ ...none, filters: { gone: { _tag: "Text", query: "x" } } }, games, columns))).toEqual([])
  })

  it("windows rows around the view", () => {
    expect(rowWindow(100, 10, 20, 5, 3)).toEqual({ start: 17, end: 28, before: 170, after: 720 })
    expect(rowWindow(100, 10, 0, 5, 3)).toEqual({ start: 0, end: 8, before: 0, after: 920 })
    expect(rowWindow(10, 10, 50, 5, 3)).toEqual({ start: 9, end: 10, before: 90, after: 0 })
    expect(rowWindow(0, 10, 0, 5, 3)).toEqual({ start: 0, end: 0, before: 0, after: 0 })
  })

  it("cycles a column's sort from ascending to descending to none", () => {
    expect(nextSort(null, "title")).toEqual({ column: "title", direction: "asc" })
    expect(nextSort({ column: "title", direction: "asc" }, "title")).toEqual({ column: "title", direction: "desc" })
    expect(nextSort({ column: "title", direction: "desc" }, "title")).toBeNull()
    expect(nextSort({ column: "title", direction: "desc" }, "rating")).toEqual({ column: "rating", direction: "asc" })
  })
})
