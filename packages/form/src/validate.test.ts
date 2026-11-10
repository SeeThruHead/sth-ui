import { describe, expect, it } from "@effect/vitest"
import { Effect, Option, Schema } from "effect"
import {
  errorAt,
  filterErrors,
  formRootRule,
  getStatus,
  issueErrors,
  ruleForPath,
  schemaResolver,
  shouldValidateOnChange,
  standardResolver,
  validateFieldValue,
  validateValues
} from "./validate.ts"
import type { Rules } from "./validate.ts"
import { isNotEmpty } from "./validators.ts"

const values = { name: "", age: 20, fruits: [{ name: "" }, { name: "Apple" }], address: { city: "" } }

const rules: Rules = {
  name: isNotEmpty("Name is required"),
  age: (value) => (typeof value === "number" && value < 18 ? "Too young" : null),
  fruits: {
    name: isNotEmpty("Fruit name"),
    [formRootRule]: (value) => (Array.isArray(value) && value.length < 3 ? "Add a fruit" : null)
  },
  address: { city: isNotEmpty("City"), [formRootRule]: () => "Address" },
  missing: { inner: isNotEmpty() }
}

describe("form validation, as @mantine/form's", () => {
  it("validates nested rules, list items and root rules", () => {
    expect(validateValues(rules, values)).toEqual({
      errors: {
        name: "Name is required",
        "fruits.0.name": "Fruit name",
        fruits: "Add a fruit",
        "address.city": "City",
        address: "Address"
      },
      pending: Option.none()
    })
    expect(validateValues(undefined, values)).toEqual({ errors: {}, pending: Option.none() })
    expect(validateValues({ address: { city: isNotEmpty("City") } }, values).errors).toEqual({ "address.city": "City" })
  })

  it.effect("collects async rules and validate functions", () =>
    Effect.gen(function* () {
      const async = validateValues({ name: () => Effect.succeed("Taken"), age: () => null }, values)
      expect(async.errors).toEqual({})
      const taken = yield* Option.getOrThrow(async.pending)
      expect(taken).toEqual({ name: "Taken" })
      expect(validateValues((input) => ({ name: input === values ? "Bad" : null, age: false }), values).errors).toEqual(
        { name: "Bad" }
      )
      const deferred = validateValues(() => Effect.succeed({ name: "Later", age: undefined }), values)
      const later = yield* Option.getOrThrow(deferred.pending)
      expect(later).toEqual({ name: "Later" })
    })
  )

  it("finds rules and errors for a path", () => {
    expect(Option.isSome(ruleForPath("fruits.1.name", rules))).toBe(true)
    expect(Option.isNone(ruleForPath("address", rules))).toBe(true)
    expect(Option.isNone(ruleForPath("name.deep", rules))).toBe(true)
    expect(errorAt("fruits", { "fruits.0.name": "x" })).toEqual(Option.some("x"))
    expect(errorAt("fruits.1", { "fruits.0.name": "x" })).toEqual(Option.none())
    expect(filterErrors({ a: null, b: undefined, c: false, d: "x", e: true })).toEqual({ d: "x", e: true })
  })

  it.effect("validates one field by its rule or the whole form", () =>
    Effect.gen(function* () {
      expect(validateFieldValue("name", rules, values)).toEqual({
        error: Option.some("Name is required"),
        pending: Option.none()
      })
      expect(validateFieldValue("age", rules, values)).toEqual({ error: Option.none(), pending: Option.none() })
      expect(validateFieldValue("address", rules, values).error).toEqual(Option.some("City"))
      expect(
        validateFieldValue("name", (input) => ({ name: input === values ? "Whole" : null }), values).error
      ).toEqual(Option.some("Whole"))
      expect(validateFieldValue("name", undefined, values).error).toEqual(Option.none())
      const async = validateFieldValue("name", { name: () => Effect.succeed("Busy") }, values)
      expect(async.error).toEqual(Option.none())
      const busy = yield* Option.getOrThrow(async.pending)
      expect(busy).toEqual(Option.some("Busy"))
      const whole = validateFieldValue("name", () => Effect.succeed({ name: "Async" }), values)
      const wholeError = yield* Option.getOrThrow(whole.pending)
      expect(wholeError).toEqual(Option.some("Async"))
    })
  )

  it("decides when to validate on change and reads status", () => {
    expect(shouldValidateOnChange("name", true)).toBe(true)
    expect(shouldValidateOnChange("name", false)).toBe(false)
    expect(shouldValidateOnChange("fruits.2.name", ["fruits.__MANTINE_FORM_INDEX__.name"])).toBe(true)
    expect(shouldValidateOnChange("age", ["name"])).toBe(false)
    expect(getStatus({ a: false, "b.c": true })).toBe(true)
    expect(getStatus({ a: false })).toBe(false)
    expect(getStatus({ a: true }, "a")).toBe(true)
    expect(getStatus({ "b.c": true }, "b")).toBe(true)
    expect(getStatus({ "b.c": false, bc: true }, "b")).toBe(false)
  })

  it.effect("turns Schema issues into errors by path", () =>
    Effect.gen(function* () {
      const schema = Schema.Struct({
        name: Schema.String.check(Schema.isMinLength(2, { message: "Too short" })),
        tags: Schema.Array(Schema.String.check(Schema.isNonEmpty({ message: "Empty tag" })))
      })
      const resolve = schemaResolver(schema)
      const result = resolve({ name: "a", tags: ["", "ok"] })
      const errors = Effect.isEffect(result) ? yield* result : result
      expect(errors).toEqual({ name: "Too short", "tags.0": "Empty tag" })
      const valid = resolve({ name: "ab", tags: [] })
      const validErrors = Effect.isEffect(valid) ? yield* valid : valid
      expect(validErrors).toEqual({})
      const later = standardResolver({
        "~standard": { validate: () => Promise.resolve({ issues: [{ message: "Later", path: [{ key: "a" }, 0] }] }) }
      })(null)
      const laterErrors = Effect.isEffect(later) ? yield* later : later
      expect(laterErrors).toEqual({ "a.0": "Later" })
      expect(
        issueErrors([{ message: "Root" }, { message: "First", path: ["x"] }, { message: "Second", path: ["x"] }])
      ).toEqual({
        "": "Root",
        x: "First"
      })
    })
  )
})
