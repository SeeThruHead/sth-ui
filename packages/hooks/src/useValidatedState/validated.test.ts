import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import { changeValidated, validated } from "./validated.ts"

const even = (value: number) => value % 2 === 0

describe("validated, as Mantine's useValidatedState", () => {
  it("starts from the initial value", () => {
    expect(validated(2, even)).toEqual({ value: 2, lastValidValue: Option.some(2), valid: true })
    expect(validated(3, even)).toEqual({ value: 3, lastValidValue: Option.none(), valid: false })
    expect(validated(3, even, true).valid).toBe(true)
  })

  it.prop(
    "always holds the latest value and its validity",
    [Schema.Int, Schema.Array(Schema.Int)],
    ([start, changes]) => {
      const end = changes.reduce((state, value) => changeValidated(state, value, even), validated(start, even))
      const last = changes.at(-1) ?? start
      expect(end.value).toBe(last)
      expect(end.valid).toBe(changes.length === 0 ? even(start) : even(last))
    }
  )

  it.prop("keeps the last value that passed", [Schema.Int, Schema.Array(Schema.Int)], ([start, changes]) => {
    const end = changes.reduce((state, value) => changeValidated(state, value, even), validated(start, even))
    expect(end.lastValidValue).toEqual(Option.fromNullishOr([start, ...changes].filter(even).at(-1)))
  })
})
