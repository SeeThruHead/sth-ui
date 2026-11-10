import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Option } from "effect"
import { TestClock } from "effect/testing"
import * as FoldkitCommand from "foldkit/command"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  errorOf,
  getValue,
  getValues,
  init,
  insertListItem,
  isDirty,
  isTouched,
  isValid,
  isValidating,
  Message,
  OutMessage,
  removeListItem,
  reorderListItem,
  replaceListItem,
  reset,
  setFieldValue,
  setValues,
  submit,
  update,
  validate,
  validateFieldMessage
} from "./form.ts"
import type { FormContext, Model } from "./form.ts"
import { isEmail, isNotEmpty } from "./validators.ts"

const initialValues = { email: "", name: "", fruits: [{ name: "Apple" }, { name: "" }] }

const context: FormContext = {
  validate: {
    email: isEmail("Invalid email"),
    name: isNotEmpty("Required"),
    fruits: { name: isNotEmpty("Fruit name") }
  }
}

const empty = init({ name: "user", initialValues })

const { Command, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const byStory = { execute: Effect.die("resolved by the story") }

const FormDebounce = FoldkitCommand.define("FormDebounce", { messages: [Message.ElapsedDebounce], ...byStory })

const FormValidation = FoldkitCommand.define("FormValidation", { messages: [Message.ValidatedForm], ...byStory })

const FormFieldValidation = FoldkitCommand.define("FormFieldValidation", {
  messages: [Message.ValidatedField],
  ...byStory
})

const form = (formContext: FormContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, formContext))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const check = (from: Model, sent: Message, formContext: FormContext, ...steps: ReadonlyArray<Step>) =>
  story(form(formContext), given(from), message(sent), ...steps)

const after = (from: Model, messages: ReadonlyArray<Message>, formContext: FormContext = context) =>
  modelAfter(form(formContext), from, messages)

const errors = (expected: object) => model<Model>((current) => expect(current.errors).toEqual(expected))

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const unchanged = (from: Model, sent: Message, formContext: FormContext = context) =>
  check(
    from,
    sent,
    formContext,
    model((current) => expect(current).toEqual(from))
  )

const filled = after(
  empty,
  [setFieldValue("email", "a@b.co"), setFieldValue("name", "Ann"), setFieldValue("fruits.1.name", "Pear")],
  {}
)

const allErrors = { email: "Invalid email", name: "Required", "fruits.1.name": "Fruit name" }

const run = (command: FoldkitCommand.Command<Message> | undefined) =>
  command === undefined ? Effect.die("no command") : command.effect

describe("form state, as useForm", () => {
  it("starts from its config", () => {
    expect(init()).toMatchObject({ name: "", values: {}, initialized: false })
    expect(init({ initialErrors: { a: "x" }, initialTouched: { a: true }, initialDirty: { a: true } })).toMatchObject({
      errors: { a: "x" },
      touched: { a: true },
      dirty: { a: true }
    })
    expect(empty.initialized).toBe(true)
  })

  it("sets a field, marking it dirty and touched and clearing its error", () =>
    check(
      { ...empty, errors: { name: "Required", email: "Invalid email" } },
      setFieldValue("name", "Ann"),
      context,
      model((current) => expect(getValue(current, "name")).toBe("Ann")),
      errors({ email: "Invalid email" }),
      model((current) => expect([isDirty(current, "name"), isTouched(current, "name")]).toEqual([true, true])),
      expectOutMessage([
        OutMessage.ValuesChanged({ values: { ...initialValues, name: "Ann" }, previous: initialValues })
      ]),
      message(setFieldValue("name", "")),
      model((current) => expect(isDirty(current, "name")).toBe(false))
    ))

  it("keeps errors when asked, and touches on focus when asked", () => {
    const withError = { ...empty, errors: { name: "Required", email: "Invalid email" } }
    check(
      withError,
      setFieldValue("name", "Ann"),
      { ...context, clearInputErrorOnChange: false },
      errors(withError.errors)
    )
    check(
      empty,
      setFieldValue("name", "Ann"),
      { touchTrigger: "focus" },
      model((current) => expect(isTouched(current, "name")).toBe(false))
    )
  })

  it("validates on change and blur when asked", () => {
    const onChange = { ...context, validateInputOnChange: ["email"] }
    check(empty, setFieldValue("email", "nope"), onChange, errors({ email: "Invalid email" }))
    check(empty, setFieldValue("name", ""), onChange, errors({}))
    check(
      empty,
      Message.BlurredField({ path: "name" }),
      { ...context, validateInputOnBlur: true },
      errors({ name: "Required" })
    )
    story(withDefaults, given(empty), message(Message.BlurredField({ path: "name" })), errors({}))
    story(
      withDefaults,
      given(empty),
      message(Message.FocusedField({ path: "email" })),
      model((current) => expect(isTouched(current)).toBe(true))
    )
  })

  it("debounces validation", () =>
    check(
      empty,
      setFieldValue("email", "x"),
      { ...context, validateInputOnChange: true, validateDebounce: 200 },
      Command.expectExact(FormDebounce),
      Command.resolve(FormDebounce, Message.ElapsedDebounce({ path: "email", generation: 1 })),
      errors({ email: "Invalid email" })
    ))

  it("drops a stale debounce", () => {
    const debounced = after(empty, [setFieldValue("email", "x")], {
      ...context,
      validateInputOnChange: true,
      validateDebounce: 200
    })
    unchanged(debounced, Message.ElapsedDebounce({ path: "email", generation: 6 }))
  })

  it.effect("waits the debounce before validating", () =>
    Effect.gen(function* () {
      const debounced = update(empty, setFieldValue("email", "x"), {
        ...context,
        validateInputOnChange: true,
        validateDebounce: 200
      })
      const fiber = yield* Effect.forkChild(run(debounced.commands[0]))
      yield* TestClock.adjust("200 millis")
      const elapsed = yield* Fiber.join(fiber)
      expect(elapsed).toEqual(Message.ElapsedDebounce({ path: "email", generation: 1 }))
    })
  )

  it("runs async field rules and keeps the latest result", () => {
    const asyncContext: FormContext = {
      validate: { name: (value) => Effect.succeed(value === "taken" ? "Taken" : null) }
    }
    check(
      after(empty, [setFieldValue("name", "taken")], asyncContext),
      validateFieldMessage("name"),
      asyncContext,
      model((current) => expect([isValidating(current, "name"), isValidating(current)]).toEqual([true, true])),
      Command.expectExact(FormFieldValidation),
      Command.resolve(
        FormFieldValidation,
        Message.ValidatedField({ path: "name", generation: 1, error: Option.some("Taken") })
      ),
      errors({ name: "Taken" }),
      model((current) => expect(isValidating(current, "name")).toBe(false))
    )
    const started = after(
      after(empty, [setFieldValue("name", "taken")], asyncContext),
      [validateFieldMessage("name")],
      asyncContext
    )
    unchanged(started, Message.ValidatedField({ path: "name", generation: 99, error: Option.none() }), asyncContext)
    check(
      { ...started, errors: { name: "Old" } },
      Message.ValidatedField({ path: "name", generation: started.fieldGenerations["name"] ?? 0, error: Option.none() }),
      asyncContext,
      errors({})
    )
  })

  it.effect("runs the caller's async field rule", () =>
    Effect.gen(function* () {
      const asyncContext: FormContext = {
        validate: { name: (value) => Effect.succeed(value === "taken" ? "Taken" : null) }
      }
      const started = update(
        after(empty, [setFieldValue("name", "taken")], asyncContext),
        validateFieldMessage("name"),
        asyncContext
      )
      const validated = yield* run(started.commands[0])
      expect(validated).toEqual(Message.ValidatedField({ path: "name", generation: 1, error: Option.some("Taken") }))
    })
  )

  it("validates the whole form and single fields", () => {
    check(empty, validate(), context, errors(allErrors))
    check(empty, validateFieldMessage("fruits.1.name"), context, errors({ "fruits.1.name": "Fruit name" }))
    expect(isValid(empty, context)).toBe(false)
    expect(isValid(empty, context, "fruits.0.name")).toBe(true)
    expect(isValid(empty)).toBe(true)
    expect(errorOf(after(empty, [validate()]), "name")).toEqual(Option.some("Required"))
  })

  it("submits valid values, transformed, or reports the errors", () => {
    check(empty, submit(), context, expectOutMessage([OutMessage.SubmitFailed({ errors: allErrors })]))
    check(
      filled,
      submit(),
      { ...context, transformValues: (values) => ({ wrapped: values }) },
      expectOutMessage([OutMessage.SubmitSucceeded({ values: { wrapped: filled.values } })])
    )
    check(filled, submit(), {}, expectOutMessage([OutMessage.SubmitSucceeded({ values: filled.values })]))
  })

  it("submits after async rules and reports what they found", () => {
    const asyncContext: FormContext = {
      validate: { name: () => Effect.succeed("Server says no"), email: isEmail("Invalid email") }
    }
    check(
      filled,
      submit(),
      asyncContext,
      has({ formValidating: true, submitPending: true }),
      Command.expectExact(FormValidation),
      Command.resolve(FormValidation, Message.ValidatedForm({ generation: 1, errors: { name: "Server says no" } })),
      expectOutMessage([OutMessage.SubmitFailed({ errors: { name: "Server says no" } })])
    )
    check(
      filled,
      validate(),
      asyncContext,
      Command.resolve(FormValidation, Message.ValidatedForm({ generation: 1, errors: { name: "Server says no" } })),
      has({ errors: { name: "Server says no" }, formValidating: false })
    )
    unchanged(
      after(filled, [validate()], asyncContext),
      Message.ValidatedForm({ generation: 99, errors: {} }),
      asyncContext
    )
    story(withDefaults, given(filled), message(Message.SetSubmitting({ submitting: true })), has({ submitting: true }))
  })

  it.effect("runs the caller's async form rules", () =>
    Effect.gen(function* () {
      const asyncContext: FormContext = {
        validate: { name: () => Effect.succeed("Server says no"), email: isEmail("Invalid email") }
      }
      const pending = update(filled, submit(), asyncContext)
      const validated = yield* run(pending.commands[0])
      expect(validated).toEqual(Message.ValidatedForm({ generation: 1, errors: { name: "Server says no" } }))
    })
  )

  it("sets values, keeping errors when asked", () => {
    check(
      empty,
      setValues({ name: "Bo" }),
      context,
      model((current) => expect(getValues(current)).toEqual({ ...initialValues, name: "Bo" })),
      model((current) => expect(isDirty(current, "name")).toBe(true))
    )
    check(
      { ...empty, errors: { a: "x" } },
      setValues({ name: "Bo" }),
      { clearInputErrorOnChange: false },
      errors({ a: "x" })
    )
  })

  it("initializes once and sets initial values", () => {
    const initialized = after(init(), [Message.Initialized({ values: { a: 1 } })], {})
    expect(initialized).toMatchObject({ values: { a: 1 }, snapshot: { a: 1 }, initialized: true })
    unchanged(initialized, Message.Initialized({ values: { a: 2 } }), {})
    story(
      withDefaults,
      given(after(empty, [setValues({ name: "Bo" })])),
      message(Message.SetInitialValues({ values: { a: 1 } })),
      model((current) => expect(current.snapshot).toEqual({ a: 1 }))
    )
  })

  it("resets the form and single fields", () => {
    const set = after(empty, [setValues({ name: "Bo" })])
    check(
      { ...set, errors: { name: "x" }, touched: { name: true } },
      reset(),
      context,
      has({ values: initialValues, errors: {}, touched: {}, dirty: {} }),
      expectOutMessage([
        OutMessage.WasReset(),
        OutMessage.ValuesChanged({ values: initialValues, previous: set.values })
      ])
    )
    story(
      withDefaults,
      given({ ...set, errors: { name: "x" } }),
      message(Message.ResetField({ path: "name" })),
      has({ values: initialValues, errors: {} })
    )
    story(
      withDefaults,
      given(empty),
      message(reset()),
      expectOutMessage([
        OutMessage.WasReset(),
        OutMessage.ValuesChanged({ values: initialValues, previous: initialValues })
      ])
    )
  })

  it("tracks dirty fields", () => {
    const set = after(empty, [setValues({ name: "Bo" })])
    expect(isDirty(empty)).toBe(false)
    expect(isDirty(set)).toBe(true)
    expect(isDirty({ ...set, dirty: {} })).toBe(true)
    expect(isDirty({ ...empty, dirty: { name: false } })).toBe(false)
    expect(isDirty(empty, "email")).toBe(false)
    story(
      withDefaults,
      given(set),
      message(Message.ResetDirty({ values: Option.none() })),
      has({ dirty: {}, snapshot: set.values })
    )
    story(
      withDefaults,
      given(set),
      message(Message.ResetDirty({ values: Option.some({ email: "z" }) })),
      model((current) => expect(current.snapshot).toEqual({ ...Object(set.values), email: "z" }))
    )
  })

  it("sets errors, touched and dirty directly", () => {
    story(withDefaults, given(empty), message(Message.SetErrors({ errors: { a: "x" } })), errors({ a: "x" }))
    story(withDefaults, given(empty), message(Message.SetFieldError({ path: "a", error: true })), errors({ a: true }))
    story(withDefaults, given({ ...empty, errors: { a: "x" } }), message(Message.ClearedErrors()), errors({}))
    story(
      withDefaults,
      given({ ...empty, errors: { a: "x", b: "y" } }),
      message(Message.ClearedFieldError({ path: "a" })),
      errors({ b: "y" })
    )
    story(
      withDefaults,
      given(empty),
      message(Message.SetTouched({ touched: { a: true } })),
      model((current) => expect(current.touched).toEqual({ a: true }))
    )
    story(
      withDefaults,
      given(empty),
      message(Message.SetDirty({ dirty: { a: true } })),
      model((current) => expect(current.dirty).toEqual({ a: true }))
    )
    story(
      withDefaults,
      given({ ...empty, touched: { a: true } }),
      message(Message.ResetTouched()),
      model((current) => expect(current.touched).toEqual({}))
    )
  })

  it("inserts, removes, reorders and replaces list items with their state", () => {
    const errored = { ...empty, errors: { "fruits.1.name": "Fruit name" }, touched: { "fruits.1.name": true } }
    story(
      withDefaults,
      given(errored),
      message(insertListItem("fruits", { name: "Kiwi" }, 0)),
      model((current) =>
        expect(getValue(current, "fruits")).toEqual([{ name: "Kiwi" }, { name: "Apple" }, { name: "" }])
      ),
      errors({ "fruits.2.name": "Fruit name" })
    )
    story(withDefaults, given(errored), message(insertListItem("fruits", { name: "Kiwi" })), errors(errored.errors))
    story(
      withDefaults,
      given(errored),
      message(removeListItem("fruits", 0)),
      has({ errors: { "fruits.0.name": "Fruit name" }, touched: { "fruits.0.name": true } })
    )
    story(
      withDefaults,
      given(errored),
      message(reorderListItem("fruits", { from: 1, to: 0 })),
      model((current) => expect(getValue(current, "fruits.0.name")).toBe("")),
      errors({ "fruits.0.name": "Fruit name" })
    )
    story(
      withDefaults,
      given(errored),
      message(replaceListItem("fruits", 0, { name: "Fig" })),
      model((current) => expect(getValue(current, "fruits.0.name")).toBe("Fig"))
    )
  })
})
