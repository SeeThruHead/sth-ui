import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import {
  blurMask,
  clampMaskCursor,
  focusMask,
  formatMask,
  generatePattern,
  initializeMask,
  initialMaskState,
  inputMask,
  isMaskComplete,
  isMaskOptions,
  isStateComplete,
  keyDownMask,
  pasteMask,
  unformatMask
} from "./mask.ts"
import type { KeyPress, MaskOptions, MaskOutcome, MaskState } from "./mask.ts"

const phone: MaskOptions = { mask: "(999) 999-9999" }

const press = (key: string, modifiers: Partial<KeyPress> = {}): KeyPress => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers
})

const caret = (position: number) => ({ start: position, end: position })

const focused = (options: MaskOptions): MaskState => focusMask(initialMaskState, options).state

const typedInto = (state: MaskState, options: MaskOptions, text: string): MaskOutcome =>
  Array.from(text).reduce<MaskOutcome>(
    (outcome, key) =>
      keyDownMask(
        outcome.state,
        options,
        press(key),
        caret(Option.getOrElse(outcome.cursor, () => outcome.state.processed.length)),
        outcome.state.display
      ),
    focusMask(state, options)
  )

describe("formatMask, as Mantine's", () => {
  it("formats raw input into the mask", () => {
    expect(formatMask("1234567890", phone)).toBe("(123) 456-7890")
    expect(formatMask("123", phone)).toBe("(123) ")
    expect(formatMask("", { mask: "999-999" })).toBe("")
    expect(formatMask("1a2b3", { mask: "999" })).toBe("123")
    expect(formatMask("abc", { mask: "AAA", transform: (char) => char.toUpperCase() })).toBe("ABC")
    expect(formatMask("123", { mask: "AAA", transform: (char) => char.toUpperCase() })).toBe("")
    expect(formatMask("AB", { mask: "aa-aa" })).toBe("AB-")
    expect(formatMask("ff00aa", { mask: "hh:hh:hh", tokens: { h: /[0-9a-fA-F]/ } })).toBe("ff:00:aa")
    expect(formatMask("123", { mask: ["(", /[1-9]/, /\d/, /\d/, ")"] })).toBe("(123)")
    expect(formatMask("12345", { mask: "999" })).toBe("123")
    expect(formatMask("12252023", { mask: "99/99/9999" })).toBe("12/25/2023")
    expect(formatMask("123456789", { mask: "999-99-9999" })).toBe("123-45-6789")
  })

  it("parses escapes and tokens", () => {
    expect(formatMask("99123", { mask: "\\A99-999" })).toBe("A99-123")
    expect(formatMask("AB", { mask: "AA" })).toBe("AB")
    expect(formatMask("ab", { mask: "AA" })).toBe("")
    expect(formatMask("a1B2", { mask: "****" })).toBe("a1B2")
    expect(formatMask("+123", { mask: "####" })).toBe("+123")
  })

  it("lets modify change the mask by value", () => {
    const options: MaskOptions = {
      mask: "9999 9999",
      modify: (raw) => (raw.startsWith("3") ? { mask: "999 999", slotChar: null, tokens: { x: /x/ } } : undefined)
    }
    expect(formatMask("12345678", options)).toBe("1234 5678")
    expect(formatMask("345678", options)).toBe("345 678")
  })
})

describe("unformatMask, isMaskComplete and generatePattern, as Mantine's", () => {
  it("recognises mask options", () => {
    expect(isMaskOptions(phone)).toBe(true)
    expect(isMaskOptions("999")).toBe(false)
  })

  it("extracts raw values", () => {
    expect(unformatMask("(123) 456-7890", phone)).toBe("1234567890")
    expect(unformatMask("12/25/2023", { mask: "99/99/9999" })).toBe("12252023")
    expect(unformatMask("", { mask: "999-999" })).toBe("")
    expect(unformatMask("(12", phone)).toBe("12")
  })

  it("checks completeness with optional segments", () => {
    expect(isMaskComplete("(123) 456-7890", phone)).toBe(true)
    expect(isMaskComplete("(123) 456-", phone)).toBe(false)
    expect(isMaskComplete("", { mask: "999" })).toBe(false)
    expect(isMaskComplete("12/25/2023", { mask: "99/99/9999" })).toBe(true)
    expect(isMaskComplete("(123) 456-7890", { mask: "(999) 999-9999? x9999" })).toBe(true)
  })

  it("generates patterns", () => {
    expect(generatePattern("full", { mask: "999" })).toContain("[0-9]")
    expect(generatePattern("full", { mask: "(999)" })).toContain("\\(")
    expect(generatePattern("full-inexact", { mask: "99" })).not.toContain("(")
    expect(generatePattern("full", { mask: "9?9" })).toBe("([0-9])([0-9])?")
    expect(generatePattern("full-inexact", { mask: "9?9" })).toBe("[0-9][0-9]?")
    const sign = new RegExp(`^(?:${generatePattern("full", { mask: "#999" })})$`, "v")
    expect(sign.test("-123")).toBe(true)
    expect(sign.test("a123")).toBe(false)
  })
})

describe("typing, as Mantine's useMask", () => {
  it("types through literals and reports changes and completion once", () => {
    const outcome = typedInto(initialMaskState, phone, "1234567890")
    expect(outcome.state.display).toBe("(123) 456-7890")
    expect(outcome.state.raw).toBe("1234567890")
    expect(outcome.completed).toEqual(Option.some({ raw: "1234567890", masked: "(123) 456-7890" }))
    expect(outcome.prevent).toBe(true)
    expect(isStateComplete(outcome.state, phone)).toBe(true)
    const extra = keyDownMask(outcome.state, phone, press("5"), caret(14), outcome.state.display)
    expect(extra.state.display).toBe("(123) 456-7890")
    expect(extra.completed).toEqual(Option.none())
  })

  it("shows slots while focused and rejects keys that do not fit", () => {
    const state = focused(phone)
    expect(state.display).toBe("(___) ___-____")
    const typed = keyDownMask(state, phone, press("4"), caret(0), state.display)
    expect(typed.state.display).toBe("(4__) ___-____")
    expect(typed.cursor).toEqual(Option.some(2))
    expect(typed.changed).toEqual(Option.some({ raw: "4", masked: "(4__) ___-____" }))
    expect(keyDownMask(typed.state, phone, press("x"), caret(2), "").prevent).toBe(true)
    expect(keyDownMask(typed.state, phone, press("x"), caret(2), "").state).toBe(typed.state)
    expect(keyDownMask(typed.state, phone, press("Tab"), caret(2), "").prevent).toBe(false)
    expect(keyDownMask(typed.state, phone, press("c", { ctrlKey: true }), caret(2), "").prevent).toBe(false)
  })

  it("replaces a selection and stops at the end of the mask", () => {
    const full = typedInto(initialMaskState, { mask: "999" }, "123").state
    expect(keyDownMask(full, { mask: "999" }, press("9"), { start: 0, end: 2 }, "123").state.display).toBe("93_")
    expect(keyDownMask(full, { mask: "999" }, press("9"), caret(3), "123").state).toBe(full)
  })

  it("transforms typed characters", () => {
    const options: MaskOptions = { mask: "AAA", transform: (char) => char.toUpperCase() }
    expect(typedInto(initialMaskState, options, "abc").state.display).toBe("ABC")
  })

  it("leaves a multi-character slotChar in place", () => {
    const options: MaskOptions = { mask: "99/99/9999", slotChar: "mm/dd/yyyy" }
    expect(focused(options).display).toBe("mm/dd/yyyy")
    expect(typedInto(initialMaskState, options, "12").state.display).toBe("12/dd/yyyy")
    expect(focused({ mask: "99", slotChar: "m" }).display).toBe("mm")
    expect(focused({ mask: "99", slotChar: "abc" }).display).toBe("ab")
    expect(focused({ mask: "999", slotChar: "ab" }).display).toBe("ab_")
  })

  it("shows no slots without a slotChar", () => {
    expect(focused({ mask: "(999)", slotChar: null }).display).toBe("(")
  })
})

describe("deleting, as Mantine's useMask", () => {
  const filled = typedInto(initialMaskState, phone, "1234567890").state

  it("backspaces over literals", () => {
    const outcome = keyDownMask(filled, phone, press("Backspace"), caret(10), filled.display)
    expect(outcome.state.raw).toBe("123457890")
    expect(outcome.cursor).toEqual(Option.some(8))
    expect(outcome.prevent).toBe(true)
    const literal = keyDownMask(filled, phone, press("Backspace"), caret(6), filled.display)
    expect(literal.state.raw).toBe("124567890")
    expect(keyDownMask(filled, phone, press("Backspace"), caret(0), filled.display).state).toBe(filled)
    expect(keyDownMask(filled, phone, press("Backspace"), caret(1), filled.display).state).toBe(filled)
  })

  it("removes a selection or everything before the caret with a modifier", () => {
    expect(keyDownMask(filled, phone, press("Backspace"), { start: 1, end: 4 }, "").state.raw).toBe("4567890")
    const word = keyDownMask(filled, phone, press("Backspace", { metaKey: true }), caret(6), "")
    expect(word.state.raw).toBe("4567890")
    expect(word.cursor).toEqual(Option.some(0))
    expect(keyDownMask(filled, phone, press("Backspace", { ctrlKey: true }), caret(20), "").state.raw).toBe("")
  })

  it("deletes forward past literals", () => {
    expect(keyDownMask(filled, phone, press("Delete"), caret(4), "").state.raw).toBe("123567890")
    expect(keyDownMask(filled, phone, press("Delete"), { start: 1, end: 4 }, "").state.raw).toBe("4567890")
    expect(keyDownMask(filled, phone, press("Delete"), caret(14), "").state).toBe(filled)
  })
})

describe("moving, as Mantine's useMask", () => {
  const filled = typedInto(initialMaskState, phone, "1234567890").state

  it("skips literals with the arrows", () => {
    expect(keyDownMask(filled, phone, press("ArrowRight"), caret(3), filled.display).cursor).toEqual(Option.some(6))
    expect(keyDownMask(filled, phone, press("ArrowRight"), caret(1), filled.display).prevent).toBe(false)
    expect(keyDownMask(filled, phone, press("ArrowLeft"), caret(6), filled.display).cursor).toEqual(Option.some(4))
    expect(keyDownMask(filled, phone, press("ArrowLeft"), caret(3), filled.display).prevent).toBe(false)
    expect(keyDownMask(filled, phone, press("ArrowLeft"), caret(0), filled.display).prevent).toBe(false)
    expect(keyDownMask(filled, phone, press("ArrowLeft"), caret(1), filled.display).prevent).toBe(false)
    expect(keyDownMask(filled, phone, press("ArrowLeft", { shiftKey: true }), caret(6), "").prevent).toBe(false)
  })

  it("clamps the caret into the typed value", () => {
    const empty = focused(phone)
    expect(clampMaskCursor(empty, phone, caret(0), false)).toEqual(Option.some(1))
    expect(clampMaskCursor(empty, phone, caret(8), true)).toEqual(Option.some(1))
    expect(clampMaskCursor(empty, phone, caret(1), false)).toEqual(Option.none())
    expect(clampMaskCursor(empty, phone, { start: 0, end: 4 }, false)).toEqual(Option.none())
    const typed = typedInto(initialMaskState, phone, "123").state
    expect(clampMaskCursor(typed, phone, caret(12), false)).toEqual(Option.some(6))
    expect(clampMaskCursor(typed, phone, caret(0), true)).toEqual(Option.none())
  })
})

describe("history, as Mantine's useMask", () => {
  it("undoes and redoes edits", () => {
    const typed = typedInto(initialMaskState, phone, "12").state
    const undone = keyDownMask(typed, phone, press("z", { ctrlKey: true }), caret(3), typed.display)
    expect(undone.state.raw).toBe("1")
    expect(undone.prevent).toBe(true)
    const redone = keyDownMask(undone.state, phone, press("z", { metaKey: true, shiftKey: true }), caret(2), "")
    expect(redone.state.raw).toBe("12")
    const again = keyDownMask(undone.state, phone, press("y", { ctrlKey: true }), caret(2), "")
    expect(again.state.raw).toBe("12")
    expect(keyDownMask(initialMaskState, phone, press("z", { ctrlKey: true }), caret(0), "").prevent).toBe(true)
    expect(keyDownMask(initialMaskState, phone, press("y", { ctrlKey: true }), caret(0), "").prevent).toBe(true)
  })

  it("clears the redo stack on a new edit and keeps at most 100 steps", () => {
    const typed = typedInto(initialMaskState, phone, "12").state
    const undone = keyDownMask(typed, phone, press("z", { ctrlKey: true }), caret(3), "").state
    const edited = keyDownMask(undone, phone, press("5"), caret(2), "").state
    expect(edited.redo).toEqual([])
    const long = typedInto(initialMaskState, { mask: "9".repeat(120) }, "1".repeat(120)).state
    expect(long.undo).toHaveLength(100)
  })
})

describe("input, paste, focus and blur, as Mantine's useMask", () => {
  it("covers Mantine's edge cases", () => {
    const literals: MaskOptions = { mask: "--" }
    expect(clampMaskCursor(focused(literals), literals, caret(0), false)).toEqual(Option.some(2))
    const typed = typedInto(initialMaskState, phone, "12").state
    expect(blurMask(typed, phone, "(1x2").state.display).toBe("(12")
    const once = keyDownMask(typed, phone, press("Delete"), { start: 9, end: 12 }, "").state
    expect(keyDownMask(once, phone, press("Delete"), { start: 9, end: 12 }, "").state.undo).toEqual(once.undo)
    expect(keyDownMask(once, phone, press("Delete"), { start: 8, end: 12 }, "").state.undo).toHaveLength(
      once.undo.length + 1
    )
    const blurred = blurMask(typed, phone, typed.display).state
    expect(inputMask(blurred, phone, "(1x2", 3).state.raw).toBe("12")
    expect(inputMask(blurred, phone, "(13", 3).state.raw).toBe("13")
    const full = typedInto(initialMaskState, { ...phone, autoClear: true }, "1234567890").state
    expect(blurMask(full, { ...phone, autoClear: true }, full.display).value).toEqual(Option.none())
  })

  it("reformats input events and positions the caret at the cut", () => {
    const filled = typedInto(initialMaskState, phone, "1234567890").state
    const cut = inputMask(filled, phone, "(123) 7890", 6)
    expect(cut.state.raw).toBe("1237890")
    expect(cut.cursor).toEqual(Option.some(6))
    const same = inputMask(filled, phone, filled.display, 3)
    expect(same.state.undo).toBe(filled.undo)
  })

  it("pastes at the caret", () => {
    const typed = typedInto(initialMaskState, phone, "12").state
    const pasted = pasteMask(typed, phone, "345", caret(3))
    expect(pasted.state.raw).toBe("12345")
    expect(pasted.cursor).toEqual(Option.some(8))
    expect(pasted.prevent).toBe(true)
    expect(pasteMask(typed, phone, "9".repeat(20), caret(0)).cursor).toEqual(Option.some(14))
  })

  it("clears on blur when nothing was typed, or trims slots", () => {
    expect(blurMask(focused(phone), phone, "(___) ___-____").state.display).toBe("")
    const typed = typedInto(initialMaskState, phone, "12").state
    const blurred = blurMask(typed, phone, typed.display)
    expect(blurred.state.display).toBe("(12")
    expect(blurred.state.focused).toBe(false)
    expect(blurred.changed).toEqual(Option.none())
    const full = typedInto(initialMaskState, phone, "1234567890").state
    expect(blurMask(full, phone, full.display).value).toEqual(Option.none())
    expect(blurMask(typed, phone, "(1").state.display).toBe("(1")
  })

  it("auto clears an incomplete value", () => {
    const options: MaskOptions = { ...phone, autoClear: true }
    const typed = typedInto(initialMaskState, options, "12").state
    const blurred = blurMask(typed, options, typed.display)
    expect(blurred.changed).toEqual(Option.some({ raw: "", masked: "" }))
    expect(blurred.value).toEqual(Option.some(""))
    const always = blurMask(typed, { ...options, alwaysShowMask: true }, typed.display)
    expect(always.value).toEqual(Option.some("(___) ___-____"))
  })

  it("keeps the slots when the mask always shows", () => {
    const options: MaskOptions = { ...phone, alwaysShowMask: true }
    expect(initializeMask(initialMaskState, options, "").value).toEqual(Option.some("(___) ___-____"))
    expect(initializeMask(initialMaskState, phone, "").value).toEqual(Option.none())
    const typed = typedInto(initialMaskState, options, "12").state
    expect(blurMask(typed, options, typed.display).value).toEqual(Option.none())
  })

  it("does not show slots on focus when told not to", () => {
    const options: MaskOptions = { ...phone, showMaskOnFocus: false }
    expect(focusMask(initialMaskState, options).value).toEqual(Option.none())
    expect(typedInto(initialMaskState, options, "1").state.display).toBe("(1__) ___-____")
  })

  it("formats an initial value", () => {
    const outcome = initializeMask(initialMaskState, { mask: "AAA", transform: (char) => char.toUpperCase() }, "abc")
    expect(outcome.value).toEqual(Option.some("ABC"))
    expect(outcome.changed).toEqual(Option.none())
    expect(initializeMask(initialMaskState, phone, "1234567890").state.display).toBe("(123) 456-7890")
  })
})
