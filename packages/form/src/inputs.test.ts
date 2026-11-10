import { describe, expect, it } from "@effect/vitest"
import { init, Message } from "./form.ts"
import { checkboxProps, numberInputProps, radioProps, textInputProps, valueProps } from "./inputs.ts"

const form = {
  ...init({ initialValues: { name: "Ann", age: 3, agree: true, color: "red", tags: ["a"], other: 1 } }),
  errors: { name: "Short" }
}

const send = (message: Message) => message

describe("input props, as getInputProps", () => {
  it("wires text inputs with value, change, focus, blur and error", () => {
    const props = textInputProps(form, "name", send)
    expect(props).toMatchObject({ value: "Ann", error: "Short" })
    expect(props.onInput("Bo")).toEqual(Message.ChangedField({ path: "name", value: "Bo" }))
    expect(props.onFocus).toEqual(Message.FocusedField({ path: "name" }))
    expect(props.onBlur).toEqual(Message.BlurredField({ path: "name" }))
    expect(textInputProps(form, "other", send).value).toBe("")
    expect(textInputProps(form, "name", send, { withError: false, withFocus: false })).not.toHaveProperty("error")
    expect(textInputProps(form, "name", send, { withFocus: false })).not.toHaveProperty("onFocus")
    expect(textInputProps(form, "age", send)).not.toHaveProperty("error")
  })

  it("wires number inputs, checkboxes, radios and any value", () => {
    expect(numberInputProps(form, "age", send).value).toBe(3)
    expect(numberInputProps(form, "name", send).value).toBe("Ann")
    expect(numberInputProps(form, "agree", send).value).toBe("")
    expect(numberInputProps(form, "age", send).onChange(4)).toEqual(Message.ChangedField({ path: "age", value: 4 }))
    expect(checkboxProps(form, "agree", send).checked).toBe(true)
    expect(checkboxProps(form, "name", send).checked).toBe(false)
    expect(checkboxProps(form, "agree", send).onChange(false)).toEqual(
      Message.ChangedField({ path: "agree", value: false })
    )
    const red = radioProps(form, "color", "red", send)
    expect(red).toMatchObject({ checked: true, value: "red" })
    expect(red).not.toHaveProperty("onFocus")
    expect(radioProps(form, "color", "blue", send).onChange(true)).toEqual(
      Message.ChangedField({ path: "color", value: "blue" })
    )
    const tags = valueProps(form, "tags", (value) => (Array.isArray(value) ? value.map(String) : []), send)
    expect(tags.value).toEqual(["a"])
    expect(tags.onChange(["b"])).toEqual(Message.ChangedField({ path: "tags", value: ["b"] }))
  })
})
