import { describe, expect, it } from "@effect/vitest"
import { Effect, Option } from "effect"
import * as FoldkitCommand from "foldkit/command"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { fieldProps, init, isDirty, Message, OutMessage, setValue, textFieldProps, update } from "./field.ts"
import type { FieldContext, Model } from "./field.ts"
import { isEmail } from "./validators.ts"

const { Command, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const FieldValidation = FoldkitCommand.define("FieldValidation", {
  messages: [Message.Validated],
  execute: Effect.die("resolved by the story")
})

const empty: Model = init({ initialValue: "" })

const context: FieldContext = { validate: (value) => isEmail("Invalid email")(value, value, "") }

const field = (fieldContext: FieldContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, fieldContext))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (from: Model, sent: Message, fieldContext: FieldContext, ...steps: ReadonlyArray<Step>) =>
  story(field(fieldContext), given(from), message(sent), ...steps)

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const errorIs = (expected: Option.Option<string | true>) =>
  model<Model>((current) => expect(current.error).toEqual(expected))

const unchanged = (from: Model, sent: Message, fieldContext: FieldContext = {}) =>
  step(
    from,
    sent,
    fieldContext,
    model((current) => expect(current).toEqual(from))
  )

const errored: Model = { ...empty, error: Option.some("Invalid email") }

describe("field state, as useField", () => {
  it("starts from its config", () => {
    expect(init({ initialValue: 1, initialError: "x", initialTouched: true })).toMatchObject({
      error: Option.some("x"),
      touched: true
    })
    expect(empty).toMatchObject({ error: Option.none(), touched: false })
  })

  it("changes the value, clearing the error", () =>
    step(
      errored,
      setValue("a@b"),
      context,
      has({ value: "a@b", error: Option.none() }),
      expectOutMessage([OutMessage.ValueChanged({ value: "a@b" })]),
      model((current) => expect(isDirty(current)).toBe(true))
    ))

  it("keeps the error when asked, ignores the same value, and validates on change when asked", () => {
    step(errored, setValue("a@b"), { ...context, clearErrorOnChange: false }, errorIs(errored.error))
    unchanged(empty, setValue(""), context)
    step(empty, setValue("x"), { ...context, validateOnChange: true }, errorIs(Option.some("Invalid email")))
    expect(isDirty(empty)).toBe(false)
  })

  it("touches on focus and validates on blur", () => {
    story(withDefaults, given(empty), message(Message.Focused()), has({ touched: true }))
    step(empty, Message.Blurred(), { ...context, validateOnBlur: true }, errorIs(Option.some("Invalid email")))
    unchanged(empty, Message.Blurred(), context)
    story(withDefaults, given(empty), message(Message.RequestedValidation()), errorIs(Option.none()))
  })

  it("runs async validation and keeps the latest", () =>
    step(
      empty,
      Message.RequestedValidation(),
      { validate: () => Effect.succeed("Taken") },
      has({ validating: true }),
      Command.expectExact(FieldValidation),
      Command.resolve(FieldValidation, Message.Validated({ generation: 1, error: Option.some("Taken") })),
      has({ error: Option.some("Taken"), validating: false })
    ))

  it("ignores an older async result", () => {
    const started = modelAfter(field({ validate: () => Effect.succeed("Taken") }), empty, [
      Message.RequestedValidation()
    ])
    unchanged(started, Message.Validated({ generation: 9, error: Option.none() }))
  })

  it.effect("runs the caller's async validator", () =>
    Effect.gen(function* () {
      const started = update(empty, Message.RequestedValidation(), { validate: () => Effect.succeed("Taken") })
      const command = started.commands[0]
      const validated = yield* command === undefined ? Effect.die("none") : command.effect
      expect(validated).toEqual(Message.Validated({ generation: 1, error: Option.some("Taken") }))
    })
  )

  it("sets errors, resets and resets touched", () => {
    const changed = modelAfter(withDefaults, { ...empty, touched: true }, [setValue("x")])
    story(
      withDefaults,
      given(changed),
      message(Message.SetError({ error: Option.some(true) })),
      errorIs(Option.some(true))
    )
    step(
      { ...changed, error: Option.some("bad") },
      Message.Reset(),
      { ...context, validateOnChange: true },
      has({ value: "", error: Option.none(), touched: false })
    )
    story(withDefaults, given(changed), message(Message.ResetTouched()), has({ touched: false }))
  })

  it("wires inputs", () => {
    const changed = modelAfter(withDefaults, { ...empty, touched: true }, [setValue("x")])
    const props = fieldProps({ ...changed, error: Option.some("bad") }, (sent) => sent)
    expect(props).toMatchObject({ value: "x", error: "bad", onFocus: Message.Focused(), onBlur: Message.Blurred() })
    expect(props.onChange("y")).toEqual(Message.Changed({ value: "y" }))
    expect(fieldProps(changed, (sent) => sent, { withError: false, withFocus: false })).toEqual({
      value: "x",
      onChange: expect.any(Function)
    })
    const text = textFieldProps(changed, (sent) => sent)
    expect(text.value).toBe("x")
    expect(text.onInput("z")).toEqual(Message.Changed({ value: "z" }))
    expect(textFieldProps(init({ initialValue: 3 }), (sent) => sent).value).toBe("")
  })
})
