import { describe, expect, it } from "@effect/vitest"
import { Effect, Fiber, Ref, Stream } from "effect"
import { hotkeysOn, matchesHotkey, parseHotkey, pressedOf, shouldFire } from "./hotkey.ts"

const press = (
  key: string,
  modifiers: Partial<Record<"altKey" | "ctrlKey" | "metaKey" | "shiftKey", boolean>> = {},
  code = ""
) => ({
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  key,
  code,
  ...modifiers
})

const keydown = (key: string) =>
  new (class extends Event {
    readonly key = key
    readonly code = `Key${key.toUpperCase()}`
    readonly ctrlKey = true
    readonly altKey = false
    readonly metaKey = false
    readonly shiftKey = false
  })("keydown", { cancelable: true })

const tagged = (tagName: string) =>
  new (class extends EventTarget {
    readonly tagName = tagName
  })()

const settle = Effect.forEach(Array.from({ length: 20 }), () => Effect.yieldNow)

describe("hotkeys, as Mantine's useHotkeys", () => {
  it("parses hotkeys", () => {
    expect(parseHotkey("mod + Shift + K")).toEqual({
      alt: false,
      ctrl: false,
      meta: false,
      mod: true,
      shift: true,
      key: "k"
    })
    expect(parseHotkey("ctrl+[plus]").key).toBe("+")
    expect(parseHotkey("alt+meta").key).toBeUndefined()
  })

  it("matches modifiers exactly, with mod as ctrl or meta", () => {
    expect(matchesHotkey("mod+k", press("k", { ctrlKey: true }))).toBe(true)
    expect(matchesHotkey("mod+k", press("k", { metaKey: true }))).toBe(true)
    expect(matchesHotkey("mod+k", press("k"))).toBe(false)
    expect(matchesHotkey("ctrl+k", press("k", { ctrlKey: true, metaKey: true }))).toBe(false)
    expect(matchesHotkey("ctrl+k", press("k", { metaKey: true }))).toBe(false)
    expect(matchesHotkey("alt+k", press("k"))).toBe(false)
    expect(matchesHotkey("shift+k", press("k"))).toBe(false)
    expect(matchesHotkey("meta+k", press("j", { metaKey: true }))).toBe(false)
    expect(matchesHotkey("ctrl", press("Control", { ctrlKey: true }))).toBe(false)
  })

  it("names keys as Mantine does and can use physical keys", () => {
    expect(matchesHotkey("escape", press("Esc"))).toBe(true)
    expect(matchesHotkey("arrowleft", press("ArrowLeft"))).toBe(true)
    expect(matchesHotkey("shift+[plus]", press("+", { shiftKey: true }))).toBe(true)
    expect(matchesHotkey("z", press("y", {}, "KeyZ"), true)).toBe(true)
  })

  it("ignores inputs and content editable unless asked", () => {
    expect(shouldFire({ tagName: "INPUT" }, ["INPUT"], false)).toBe(false)
    expect(shouldFire({ tagName: "DIV", isContentEditable: true }, ["INPUT"], false)).toBe(false)
    expect(shouldFire({ tagName: "DIV", isContentEditable: true }, ["INPUT"], true)).toBe(true)
    expect(shouldFire(undefined, ["INPUT"], false)).toBe(true)
    expect(pressedOf({ key: "a" })).toEqual(press("a", {}, "undefined"))
  })

  it.effect("sends the hotkeys pressed on the target, preventing default unless told not to", () =>
    Effect.gen(function* () {
      const target = new EventTarget()
      const fiber = yield* hotkeysOn(target, [["mod+k"], ["ctrl+j", { preventDefault: false }], ["alt+x"]]).pipe(
        Stream.take(2),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* settle
      const first = keydown("k")
      target.dispatchEvent(first)
      const second = keydown("j")
      target.dispatchEvent(second)
      const sent = yield* Fiber.join(fiber)
      expect(sent).toEqual(["mod+k", "ctrl+j"])
      expect(first.defaultPrevented).toBe(true)
      expect(second.defaultPrevented).toBe(false)
    })
  )

  it.effect("ignores keys pressed in ignored tags", () =>
    Effect.gen(function* () {
      const sent = yield* Ref.make<ReadonlyArray<string>>([])
      const record = (hotkey: string) => Ref.update(sent, (all) => [...all, hotkey])
      const textarea = tagged("TEXTAREA")
      const input = tagged("INPUT")
      const fibers = yield* Effect.all([
        Effect.forkChild(Stream.runForEach(hotkeysOn(textarea, [["mod+k"]]), record)),
        Effect.forkChild(Stream.runForEach(hotkeysOn(input, [["mod+j"]], { tagsToIgnore: ["SELECT"] }), record))
      ])
      yield* settle
      textarea.dispatchEvent(keydown("k"))
      input.dispatchEvent(keydown("j"))
      yield* settle
      yield* Effect.forEach(fibers, Fiber.interrupt)
      const all = yield* Ref.get(sent)
      expect(all).toEqual(["mod+j"])
    })
  )
})
