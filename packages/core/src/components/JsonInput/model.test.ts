import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { init, Message, OutMessage, update, validateJson } from "./model.ts"
import type { JsonInputContext, Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const jsonInput = (context: JsonInputContext) => (current: Model, sent: Message) => update(current, sent, context)

const valid = (expected: boolean) => model<Model>((current) => expect(current.valid).toBe(expected))

const blurred = (
  context: JsonInputContext,
  ...steps: ReadonlyArray<Parameters<typeof story<Model, Message, OutMessage>>[1]>
) => story(jsonInput(context), given(init()), message(Message.Blurred()), ...steps)

const strict = (text: string) => JSON.parse(text)

describe("JsonInput validation", () => {
  it("accepts empty and valid JSON, rejects the rest", () => {
    expect(validateJson("  ", strict)).toBe(true)
    expect(validateJson('{"a":1}', strict)).toBe(true)
    expect(validateJson("{a:1}", strict)).toBe(false)
    expect(init().valid).toBe(true)
    expect(init({ value: "{" }).valid).toBe(false)
    expect(init({ value: "nope", deserialize: () => "always" }).valid).toBe(true)
  })
})

describe("JsonInput update", () => {
  it("passes typing through and clears the error on focus", () => {
    story(
      jsonInput({ value: "" }),
      given(init()),
      message(Message.Typed({ value: "{" })),
      expectOutMessage(OutMessage.Changed({ value: "{" }))
    )
    story(jsonInput({ value: "{" }), given({ valid: false }), message(Message.Focused()), valid(true))
  })

  it("validates on blur like Mantine", () => {
    blurred({ value: "{" }, valid(false), expectNoOutMessage())
    blurred({ value: '{"a":1}' }, valid(true), expectNoOutMessage())
  })

  it("formats on blur when asked", () => {
    blurred({ value: '{"a":1}', formatOnBlur: true }, expectOutMessage(OutMessage.Changed({ value: '{\n  "a": 1\n}' })))
    blurred(
      { value: '{"a":1}', formatOnBlur: true, indentSpaces: 4 },
      expectOutMessage(OutMessage.Changed({ value: '{\n    "a": 1\n}' }))
    )
    blurred(
      {
        value: "x",
        formatOnBlur: true,
        deserialize: () => ["custom"],
        serialize: (value) => `custom ${String(value)}`
      },
      expectOutMessage(OutMessage.Changed({ value: "custom custom" }))
    )
  })

  it("leaves read-only, invalid and empty values alone on blur", () => {
    blurred({ value: '{"a":1}', formatOnBlur: true, readOnly: true }, valid(true), expectNoOutMessage())
    blurred({ value: "{", formatOnBlur: true }, valid(false), expectNoOutMessage())
    blurred({ value: "  ", formatOnBlur: true }, valid(true), expectNoOutMessage())
  })
})
