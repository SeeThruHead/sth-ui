import { describe, expect, it } from "@effect/vitest"
import { foldAccents, highlighter } from "./highlighter.ts"

const marked = (value: string, highlight: string | ReadonlyArray<string>, options = {}) =>
  highlighter(value, highlight, options)
    .filter((chunk) => chunk.highlighted)
    .map((chunk) => chunk.chunk)

describe("highlighter, as Mantine's", () => {
  it("splits a value into highlighted and plain chunks", () => {
    expect(highlighter("Hello world", "hello")).toEqual([
      { chunk: "Hello", highlighted: true },
      { chunk: " world", highlighted: false }
    ])
    expect(highlighter("abc abc", "b")).toEqual([
      { chunk: "a", highlighted: false },
      { chunk: "b", highlighted: true },
      { chunk: "c a", highlighted: false },
      { chunk: "b", highlighted: true },
      { chunk: "c", highlighted: false }
    ])
    expect(highlighter("Hello", "  ")).toEqual([{ chunk: "Hello", highlighted: false }])
    expect(highlighter("Hello", ["", " "])).toEqual([{ chunk: "Hello", highlighted: false }])
    expect(highlighter("Hello", "xyz")).toEqual([{ chunk: "Hello", highlighted: false }])
    expect(marked("Hello world", " world ")).toEqual(["world"])
    expect(marked("1+1=2 (maybe)", ["1+1", "(maybe)"])).toEqual(["1+1", "(maybe)"])
    expect(marked("this and that", ["this", "that", "th"])).toEqual(["this", "that"])
  })

  it("folds accents unless told not to", () => {
    expect(marked("Café crème", "cafe")).toEqual(["Café"])
    expect(marked("Cafe creme", "café")).toEqual(["Cafe"])
    expect(marked("Café", "cafe", { accentInsensitive: false })).toEqual([])
    expect(marked("Café and café", "cafe")).toEqual(["Café", "café"])
    expect(marked("Ünïcödé text", ["unicode", "TEXT"])).toEqual(["Ünïcödé", "text"])
    expect(foldAccents("crème brûlée")).toBe("creme brulee")
  })

  it("matches case and whole words as asked", () => {
    expect(marked("Hello hello", "hello", { caseInsensitive: false })).toEqual(["hello"])
    expect(marked("Hello", "hello", { caseInsensitive: false, accentInsensitive: false })).toEqual([])
    expect(marked("HELLO", "hello", { accentInsensitive: false })).toEqual(["HELLO"])
    expect(marked("the theme there", "the", { wholeWord: true })).toEqual(["the"])
    expect(marked("the theme", "the", { wholeWord: false })).toEqual(["the", "the"])
    expect(marked("well-known (the) end.", ["the", "end"], { wholeWord: true })).toEqual(["the", "end"])
    expect(marked("in-house", "house", { wholeWord: true })).toEqual(["house"])
    expect(marked("naïve naïveté", "naïve", { wholeWord: true })).toEqual(["naïve"])
    expect(marked("abc1 abc_ abc", "abc", { wholeWord: true, accentInsensitive: false })).toEqual(["abc"])
  })
})
