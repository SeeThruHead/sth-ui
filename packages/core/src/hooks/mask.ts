import { Option, Predicate } from "effect"

export type MaskPattern = string | ReadonlyArray<string | RegExp>

export type MaskOverrides = {
  readonly mask?: MaskPattern
  readonly tokens?: Readonly<Record<string, RegExp>>
  readonly slotChar?: string | null
  readonly separate?: boolean
}

export type MaskOptions = MaskOverrides & {
  readonly mask: MaskPattern
  readonly modify?: (value: string) => MaskOverrides | undefined
  readonly alwaysShowMask?: boolean
  readonly showMaskOnFocus?: boolean
  readonly transform?: (char: string) => string
  readonly autoClear?: boolean
}

export const isMaskOptions = (value: unknown): value is MaskOptions => Predicate.hasProperty(value, "mask")

export type MaskSlot =
  | { readonly type: "token"; readonly char: string; readonly pattern: RegExp; readonly optional: boolean }
  | { readonly type: "literal"; readonly char: string; readonly optional: boolean }

type Resolved = {
  readonly slots: ReadonlyArray<MaskSlot>
  readonly slotChar: string | null
  readonly transform: (char: string) => string
}

const defaultTokens: Readonly<Record<string, RegExp>> = {
  "9": /[0-9]/,
  a: /[A-Za-z]/,
  A: /[A-Z]/,
  "*": /[A-Za-z0-9]/,
  "#": /[+\-0-9]/
}

const literal = (char: string, optional = false): MaskSlot => ({ type: "literal", char, optional })

type Parsing = { readonly slots: ReadonlyArray<MaskSlot>; readonly optional: boolean; readonly escaped: boolean }

const parsed =
  (tokens: Readonly<Record<string, RegExp>>, length: number) =>
  (state: Parsing, char: string, index: number): Parsing => {
    if (state.escaped) return { ...state, slots: [...state.slots, literal(char)], escaped: false }
    if (char === "\\" && index + 1 < length) return { ...state, escaped: true }
    if (char === "?") return { ...state, optional: true }
    const slot = Option.match(Option.fromNullishOr(tokens[char]), {
      onNone: () => literal(char, state.optional),
      onSome: (pattern): MaskSlot => ({ type: "token", char, pattern, optional: state.optional })
    })

    return { ...state, slots: [...state.slots, slot] }
  }

export const parseMask = (mask: MaskPattern, tokens: Readonly<Record<string, RegExp>>): ReadonlyArray<MaskSlot> =>
  typeof mask === "string"
    ? Array.from(mask).reduce(parsed(tokens, mask.length), { slots: [], optional: false, escaped: false }).slots
    : mask.map((item) =>
        typeof item === "string" ? literal(item) : { type: "token", char: "_", pattern: item, optional: false }
      )

const slotCharOf = (override: string | null | undefined, option: string | null | undefined): string | null => {
  if (override !== undefined) return override
  if (option !== undefined) return option

  return "_"
}

const resolve = (options: MaskOptions, raw: string): Resolved => {
  const overrides = options.modify?.(raw) ?? {}
  const tokens = { ...defaultTokens, ...options.tokens, ...overrides.tokens }
  const slotChar = slotCharOf(overrides.slotChar, options.slotChar)

  return {
    slots: parseMask(overrides.mask ?? options.mask, tokens),
    slotChar,
    transform: options.transform ?? ((char) => char)
  }
}

const slotCharAt = (slotChar: string | null, index: number): string => {
  if (slotChar === null) return ""
  if (slotChar.length > 1) return slotChar[index] ?? "_"

  return slotChar
}

const filled = (
  raw: string,
  slots: ReadonlyArray<MaskSlot>,
  transform: (char: string) => string,
  slotIndex: number,
  rawIndex: number,
  result: string
): string => {
  const slot = slots[slotIndex]
  if (slot === undefined) return result
  if (slot.type === "literal") return filled(raw, slots, transform, slotIndex + 1, rawIndex, result + slot.char)
  const char = raw[rawIndex]
  if (char === undefined) return result
  const next = transform(char)

  return slot.pattern.test(next)
    ? filled(raw, slots, transform, slotIndex + 1, rawIndex + 1, result + next)
    : filled(raw, slots, transform, slotIndex, rawIndex + 1, result)
}

export const applyMaskToRaw = (
  raw: string,
  slots: ReadonlyArray<MaskSlot>,
  transform: (char: string) => string
): string => filled(raw, slots, transform, 0, 0, "")

const displayed = (slots: ReadonlyArray<MaskSlot>, slotChar: string | null, index: number, result: string): string => {
  const slot = slots[index]
  if (slot === undefined) return result
  if (slot.type === "literal") return displayed(slots, slotChar, index + 1, result + slot.char)
  const shown = slotCharAt(slotChar, index)
  if (shown === "") return result

  return displayed(slots, slotChar, index + 1, result + shown)
}

export const buildDisplayValue = (
  value: string,
  slots: ReadonlyArray<MaskSlot>,
  slotChar: string | null,
  showSlots: boolean
): string => (showSlots ? displayed(slots, slotChar, value.length, value) : value)

export const extractRaw = (masked: string, slots: ReadonlyArray<MaskSlot>): string =>
  Array.from(masked)
    .filter((_, index) => slots[index]?.type === "token")
    .join("")

const slotFilled =
  (masked: string) =>
  (slot: MaskSlot, index: number): boolean => {
    if (slot.type === "literal") return true
    if (slot.optional) return true
    const char = masked[index]
    if (char === undefined) return false

    return slot.pattern.test(char)
  }

export const checkComplete = (masked: string, slots: ReadonlyArray<MaskSlot>): boolean =>
  slots.every(slotFilled(masked))

const firstTokenFrom = (slots: ReadonlyArray<MaskSlot>, from: number): number => {
  const index = slots.findIndex((slot, position) => position >= from && slot.type === "token")

  return index === -1 ? slots.length : index
}

const lastTokenUpTo = (slots: ReadonlyArray<MaskSlot>, from: number): number =>
  slots.findLastIndex((slot, position) => position <= from && slot.type === "token")

const isLiteralAt = (slots: ReadonlyArray<MaskSlot>, position: number): boolean => slots[position]?.type === "literal"

const editableFrom = (from: number, slots: ReadonlyArray<MaskSlot>, value: string): number => {
  if (from >= value.length) return from
  if (!isLiteralAt(slots, from)) return from

  return editableFrom(from + 1, slots, value)
}

const pastLiterals = (from: number, slots: ReadonlyArray<MaskSlot>): number =>
  isLiteralAt(slots, from) ? pastLiterals(from + 1, slots) : from

const beforeLiterals = (from: number, slots: ReadonlyArray<MaskSlot>): number =>
  isLiteralAt(slots, from) ? beforeLiterals(from - 1, slots) : from

type Match = { readonly char: string; readonly next: number }

const matchFrom = (
  input: string,
  pattern: RegExp,
  transform: (char: string) => string,
  index: number
): Option.Option<Match> => {
  const char = input[index]
  if (char === undefined) return Option.none()
  const next = transform(char)

  return pattern.test(next)
    ? Option.some({ char: next, next: index + 1 })
    : matchFrom(input, pattern, transform, index + 1)
}

const processed = (
  input: string,
  slots: ReadonlyArray<MaskSlot>,
  transform: (char: string) => string,
  slotIndex: number,
  inputIndex: number,
  result: string
): string => {
  const slot = slots[slotIndex]
  if (slot === undefined) return result
  if (slot.type === "literal")
    return processed(
      input,
      slots,
      transform,
      slotIndex + 1,
      input[inputIndex] === slot.char ? inputIndex + 1 : inputIndex,
      result + slot.char
    )

  return Option.match(matchFrom(input, slot.pattern, transform, inputIndex), {
    onNone: () => result,
    onSome: ({ char, next }) => processed(input, slots, transform, slotIndex + 1, next, result + char)
  })
}

export const processInput = (
  input: string,
  slots: ReadonlyArray<MaskSlot>,
  transform: (char: string) => string = (char) => char
): string => processed(input, slots, transform, 0, 0, "")

export const formatMask = (raw: string, options: MaskOptions): string => {
  const { slots, transform } = resolve(options, raw)

  return applyMaskToRaw(raw, slots, transform)
}

export const unformatMask = (masked: string, options: MaskOptions): string =>
  extractRaw(masked, resolve(options, "").slots)

export const isMaskComplete = (masked: string, options: MaskOptions): boolean =>
  checkComplete(masked, resolve(options, "").slots)

const patternOf =
  (mode: "full" | "full-inexact") =>
  (slot: MaskSlot): string => {
    if (slot.type === "literal") return slot.char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const source = slot.pattern.source
    if (mode === "full-inexact") return slot.optional ? `${source}?` : source

    return slot.optional ? `(${source})?` : `(${source})`
  }

export const generatePattern = (mode: "full" | "full-inexact", options: MaskOptions): string =>
  resolve(options, "").slots.map(patternOf(mode)).join("")

type Undo = { readonly raw: string; readonly selectionStart: number }

export type MaskState = {
  readonly processed: string
  readonly display: string
  readonly raw: string
  readonly wasComplete: boolean
  readonly focused: boolean
  readonly undo: ReadonlyArray<Undo>
  readonly redo: ReadonlyArray<Undo>
}

export const initialMaskState: MaskState = {
  processed: "",
  display: "",
  raw: "",
  wasComplete: false,
  focused: false,
  undo: [],
  redo: []
}

export type MaskValues = { readonly raw: string; readonly masked: string }

export type MaskOutcome = {
  readonly state: MaskState
  readonly value: Option.Option<string>
  readonly cursor: Option.Option<number>
  readonly changed: Option.Option<MaskValues>
  readonly completed: Option.Option<MaskValues>
  readonly prevent: boolean
}

export type Selection = { readonly start: number; readonly end: number }

export type KeyPress = {
  readonly key: string
  readonly metaKey: boolean
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly shiftKey: boolean
}

const unchanged = (state: MaskState, prevent = false): MaskOutcome => ({
  state,
  value: Option.none(),
  cursor: Option.none(),
  changed: Option.none(),
  completed: Option.none(),
  prevent
})

export const isStateComplete = (state: MaskState, options: MaskOptions): boolean =>
  checkComplete(state.processed, resolve(options, state.raw).slots)

const maxUndo = 100

const sameUndo = (top: Undo | undefined, next: Undo): boolean => {
  if (top === undefined) return false
  if (top.raw !== next.raw) return false

  return top.selectionStart === next.selectionStart
}

const pushUndo = (state: MaskState, selectionStart: number): MaskState => {
  const entry = { raw: state.raw, selectionStart }
  if (sameUndo(state.undo.at(-1), entry)) return state

  return { ...state, undo: [...state.undo, entry].slice(-maxUndo), redo: [] }
}

const showsSlots = (state: MaskState, options: MaskOptions, reprocessed: string): boolean => {
  if (options.alwaysShowMask !== true && !state.focused) return false

  return options.showMaskOnFocus !== false || reprocessed.length > 0
}

type Applied = {
  readonly reprocessed: string
  readonly raw: string
  readonly display: string
  readonly slots: ReadonlyArray<MaskSlot>
  readonly cursor: Option.Option<number>
  readonly notify: boolean
}

const applied = (state: MaskState, next: Applied): MaskOutcome => {
  const complete = checkComplete(next.reprocessed, next.slots)
  const values = { raw: next.raw, masked: next.display }

  return {
    state: { ...state, processed: next.reprocessed, display: next.display, raw: next.raw, wasComplete: complete },
    value: Option.some(next.display),
    cursor: Option.map(next.cursor, (position) => Math.min(position, next.reprocessed.length)),
    changed: next.notify ? Option.some(values) : Option.none(),
    completed: next.notify && complete && !state.wasComplete ? Option.some(values) : Option.none(),
    prevent: false
  }
}

const updated = (
  state: MaskState,
  options: MaskOptions,
  masked: string,
  cursor: Option.Option<number>
): MaskOutcome => {
  const first = extractRaw(masked, resolve(options, "").slots)
  const raw = extractRaw(masked, resolve(options, first).slots)
  const { slots, slotChar } = resolve(options, raw)
  const reprocessed = processInput(masked, slots)

  return applied(state, {
    reprocessed,
    raw: extractRaw(reprocessed, slots),
    display: buildDisplayValue(reprocessed, slots, slotChar, showsSlots(state, options, reprocessed)),
    slots,
    cursor,
    notify: true
  })
}

export const initializeMask = (state: MaskState, options: MaskOptions, value: string): MaskOutcome => {
  if (value === "") return alwaysShown(state, options)
  const initial = resolve(options, "")
  const raw = extractRaw(processInput(value, initial.slots, initial.transform), initial.slots)
  const { slots, slotChar, transform } = resolve(options, raw)
  const reprocessed = processInput(value, slots, transform)

  return applied(state, {
    reprocessed,
    raw: extractRaw(reprocessed, slots),
    display: buildDisplayValue(reprocessed, slots, slotChar, showsSlots(state, options, reprocessed)),
    slots,
    cursor: Option.none(),
    notify: false
  })
}

const alwaysShown = (state: MaskState, options: MaskOptions): MaskOutcome => {
  if (options.alwaysShowMask !== true) return unchanged(state)
  const { slots, slotChar } = resolve(options, "")
  const display = buildDisplayValue("", slots, slotChar, true)

  return { ...unchanged({ ...state, display }), value: Option.some(display) }
}

const commonPrefix = (a: string, b: string): number => {
  const length = Math.min(a.length, b.length)
  const index = Array.from({ length }, (_, position) => position).findIndex((position) => a[position] !== b[position])

  return index === -1 ? length : index
}

const commonSuffix = (a: string, b: string, limit: number): number => {
  const index = Array.from({ length: limit }, (_, position) => position).findIndex(
    (position) => a[a.length - 1 - position] !== b[b.length - 1 - position]
  )

  return index === -1 ? limit : index
}

const rawBetween = (masked: string, slots: ReadonlyArray<MaskSlot>, from: number, to?: number): string =>
  extractRaw(masked.slice(from, to), slots.slice(from, to))

export const inputMask = (
  state: MaskState,
  options: MaskOptions,
  current: string,
  selectionStart: number
): MaskOutcome => {
  const { slots, transform } = resolve(options, "")
  const previous = state.display
  const prefix = commonPrefix(previous, current)
  const suffix = commonSuffix(previous, current, Math.min(previous.length - prefix, current.length - prefix))
  const inserted = current.slice(prefix, current.length - suffix)
  const before = rawBetween(previous, slots, 0, prefix)
  const after = rawBetween(previous, slots, previous.length - suffix)
  const reformatted = applyMaskToRaw(before + inserted + after, slots, transform)
  const cursor = applyMaskToRaw(before + inserted, slots, transform).length
  const recorded = reformatted === previous ? state : pushUndo(state, selectionStart)

  return updated(recorded, options, reformatted, Option.some(cursor))
}

export const focusMask = (state: MaskState, options: MaskOptions): MaskOutcome => {
  const focused = { ...state, focused: true }
  if (options.showMaskOnFocus === false && options.alwaysShowMask !== true) return unchanged(focused)
  const { slots, slotChar } = resolve(options, "")
  const display = buildDisplayValue(state.processed, slots, slotChar, true)

  return { ...unchanged({ ...focused, display }), value: Option.some(display) }
}

const outsideTyped = (start: number, endPosition: number, startPosition: number, keepBefore: boolean): boolean => {
  if (start > endPosition) return true
  if (keepBefore) return false

  return start < startPosition
}

export const clampMaskCursor = (
  state: MaskState,
  options: MaskOptions,
  selection: Selection,
  keepBefore: boolean
): Option.Option<number> => {
  if (selection.start !== selection.end) return Option.none()
  const { slots } = resolve(options, "")
  const firstToken = firstTokenFrom(slots, 0)
  const end = state.processed.length > 0 ? editableFrom(state.processed.length, slots, state.processed) : firstToken

  return outsideTyped(selection.start, end, firstToken, keepBefore) ? Option.some(end) : Option.none()
}

const cleared = (state: MaskState, options: MaskOptions, slots: ReadonlyArray<MaskSlot>, slotChar: string | null) => {
  const display = options.alwaysShowMask === true ? buildDisplayValue("", slots, slotChar, true) : ""

  return {
    ...unchanged({ ...state, processed: "", display, raw: "", wasComplete: false }),
    value: Option.some(display),
    changed: Option.some({ raw: "", masked: "" })
  }
}

const clearsOnBlur = (options: MaskOptions, complete: boolean, typed: string): boolean => {
  if (options.autoClear !== true) return false
  if (complete) return false

  return typed.length > 0
}

export const blurMask = (state: MaskState, options: MaskOptions, value: string): MaskOutcome => {
  const blurred = { ...state, focused: false }
  const { slots, slotChar } = resolve(options, state.raw)
  const focusDisplay = buildDisplayValue(state.processed, slots, slotChar, true)
  const typed = value === focusDisplay ? state.processed : processInput(value, slots)
  const complete = checkComplete(typed, slots)
  if (clearsOnBlur(options, complete, typed)) return cleared(blurred, options, slots, slotChar)
  if (options.alwaysShowMask === true || complete) return unchanged(blurred)
  if (extractRaw(typed, slots).length === 0) return cleared(blurred, options, slots, slotChar)
  const display = buildDisplayValue(typed, slots, slotChar, false)

  return { ...unchanged({ ...blurred, display }), value: Option.some(display) }
}

const withHistory = (state: MaskState, options: MaskOptions, target: Undo): MaskOutcome => {
  const { slots, transform } = resolve(options, target.raw)
  const outcome = updated(
    state,
    options,
    applyMaskToRaw(target.raw, slots, transform),
    Option.some(target.selectionStart)
  )

  return { ...outcome, prevent: true }
}

const undone = (state: MaskState, options: MaskOptions, start: number): MaskOutcome =>
  Option.match(Option.fromNullishOr(state.undo.at(-1)), {
    onNone: () => unchanged(state, true),
    onSome: (previous) =>
      withHistory(
        { ...state, undo: state.undo.slice(0, -1), redo: [...state.redo, { raw: state.raw, selectionStart: start }] },
        options,
        previous
      )
  })

const redone = (state: MaskState, options: MaskOptions, start: number): MaskOutcome =>
  Option.match(Option.fromNullishOr(state.redo.at(-1)), {
    onNone: () => unchanged(state, true),
    onSome: (next) =>
      withHistory(
        { ...state, redo: state.redo.slice(0, -1), undo: [...state.undo, { raw: state.raw, selectionStart: start }] },
        options,
        next
      )
  })

const edited = (state: MaskState, options: MaskOptions, raw: string, cursor: Option.Option<number>, start: number) => {
  const { slots, transform } = resolve(options, state.raw)

  return { ...updated(pushUndo(state, start), options, applyMaskToRaw(raw, slots, transform), cursor), prevent: true }
}

const removedRange = (state: MaskState, options: MaskOptions, selection: Selection): MaskOutcome => {
  const { slots } = resolve(options, state.raw)
  const end = Math.min(selection.end, state.processed.length)
  const raw = extractRaw(state.processed.slice(0, selection.start), slots) + rawBetween(state.processed, slots, end)

  return edited(state, options, raw, Option.some(selection.start), selection.start)
}

const isModifier = (press: KeyPress): boolean => {
  if (press.metaKey) return true
  if (!press.ctrlKey) return false

  return !press.altKey
}

const isRedo = (press: KeyPress, key: string): boolean => {
  if (key === "z") return press.shiftKey

  return key === "y" && !press.shiftKey
}

const backspaced = (state: MaskState, options: MaskOptions, press: KeyPress, selection: Selection): MaskOutcome => {
  const { slots } = resolve(options, state.raw)
  if (isModifier(press)) {
    const start = Math.min(selection.start, state.processed.length)

    return edited(state, options, rawBetween(state.processed, slots, start), Option.some(0), selection.start)
  }
  if (selection.start !== selection.end) return removedRange(state, options, selection)
  if (selection.start === 0) return unchanged(state, true)
  const position = beforeLiterals(selection.start - 1, slots)
  if (position < 0) return unchanged(state, true)
  const raw = rawBetween(state.processed, slots, 0, position) + rawBetween(state.processed, slots, position + 1)

  return edited(state, options, raw, Option.some(position), selection.start)
}

const deleted = (state: MaskState, options: MaskOptions, selection: Selection): MaskOutcome => {
  if (selection.start !== selection.end) return removedRange(state, options, selection)
  const { slots } = resolve(options, state.raw)
  const position = pastLiterals(selection.start, slots)
  if (position >= state.processed.length) return unchanged(state, true)
  const raw = rawBetween(state.processed, slots, 0, selection.start) + rawBetween(state.processed, slots, position + 1)

  return edited(state, options, raw, Option.some(selection.start), selection.start)
}

const moved = (state: MaskState, cursor: number): MaskOutcome => ({
  ...unchanged(state, true),
  cursor: Option.some(cursor)
})

const arrowedRight = (state: MaskState, options: MaskOptions, start: number, value: string): MaskOutcome => {
  const next = editableFrom(start + 1, resolve(options, state.raw).slots, value)

  return next === start + 1 ? unchanged(state) : moved(state, next)
}

const arrowedLeft = (state: MaskState, options: MaskOptions, start: number): MaskOutcome => {
  if (start === 0) return unchanged(state)
  const previous = lastTokenUpTo(resolve(options, state.raw).slots, start - 1)
  if (previous < 0) return unchanged(state)

  return previous === start - 1 ? unchanged(state) : moved(state, previous + 1)
}

const typed = (state: MaskState, options: MaskOptions, key: string, selection: Selection): MaskOutcome => {
  const { slots, transform } = resolve(options, state.raw)
  const position = pastLiterals(Math.min(selection.start, state.processed.length), slots)
  const slot = slots[position]
  if (slot?.type !== "token") return unchanged(state, true)
  const char = transform(key)
  if (!slot.pattern.test(char)) return unchanged(state, true)
  const afterFrom = selection.start < selection.end ? Math.min(selection.end, state.processed.length) : position
  const raw = rawBetween(state.processed, slots, 0, position) + char + rawBetween(state.processed, slots, afterFrom)
  const next = applyMaskToRaw(raw, slots, transform)

  return edited(state, options, raw, Option.some(editableFrom(position + 1, slots, next)), selection.start)
}

const isPrintable = (press: KeyPress): boolean => {
  if (press.key.length !== 1) return false
  if (press.ctrlKey || press.metaKey) return false

  return !press.altKey
}

const isPlainArrow = (press: KeyPress, key: string): boolean => press.key === key && !press.shiftKey

export const keyDownMask = (
  state: MaskState,
  options: MaskOptions,
  press: KeyPress,
  selection: Selection,
  value: string
): MaskOutcome => {
  const key = press.key.toLowerCase()
  if (isModifier(press) && key === "z" && !press.shiftKey) return undone(state, options, selection.start)
  if (isModifier(press) && isRedo(press, key)) return redone(state, options, selection.start)
  if (press.key === "Backspace") return backspaced(state, options, press, selection)
  if (press.key === "Delete") return deleted(state, options, selection)
  if (isPlainArrow(press, "ArrowRight")) return arrowedRight(state, options, selection.start, value)
  if (isPlainArrow(press, "ArrowLeft")) return arrowedLeft(state, options, selection.start)
  if (isPrintable(press)) return typed(state, options, press.key, selection)

  return unchanged(state)
}

export const pasteMask = (state: MaskState, options: MaskOptions, text: string, selection: Selection): MaskOutcome => {
  const { slots, transform } = resolve(options, "")
  const start = Math.min(selection.start, state.processed.length)
  const end = Math.min(selection.end, state.processed.length)
  const before = rawBetween(state.processed, slots, 0, start)
  const masked = applyMaskToRaw(before + text + rawBetween(state.processed, slots, end), slots, transform)
  const outcome = updated(pushUndo(state, selection.start), options, masked, Option.none())
  const cursor = Math.min(applyMaskToRaw(before + text, slots, transform).length, slots.length)

  return { ...outcome, cursor: Option.some(cursor), prevent: true }
}
