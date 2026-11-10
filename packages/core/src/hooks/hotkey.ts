import type { Cause } from "effect"
import { Effect, Queue, Stream } from "effect"

export type Hotkey = {
  readonly alt: boolean
  readonly ctrl: boolean
  readonly meta: boolean
  readonly mod: boolean
  readonly shift: boolean
  readonly key: string | undefined
}

export type Pressed = {
  readonly altKey: boolean
  readonly ctrlKey: boolean
  readonly metaKey: boolean
  readonly shiftKey: boolean
  readonly key: string
  readonly code: string
}

export type HotkeyOptions = { readonly preventDefault?: boolean; readonly usePhysicalKeys?: boolean }

export type HotkeyItem = readonly [string, HotkeyOptions?]

const keyNames: Readonly<Record<string, string>> = {
  " ": "space",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  Escape: "escape",
  Esc: "escape",
  esc: "escape",
  Enter: "enter",
  Tab: "tab",
  Backspace: "backspace",
  Delete: "delete",
  Insert: "insert",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  "+": "plus",
  "-": "minus",
  "*": "asterisk",
  "/": "slash"
}

const normalize = (key: string) => keyNames[key] ?? key.replace("Key", "").toLowerCase()

const reserved = ["alt", "ctrl", "meta", "shift", "mod"]

export const parseHotkey = (hotkey: string): Hotkey => {
  const keys = hotkey
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
  const free = keys.find((key) => !reserved.includes(key))

  return {
    alt: keys.includes("alt"),
    ctrl: keys.includes("ctrl"),
    meta: keys.includes("meta"),
    mod: keys.includes("mod"),
    shift: keys.includes("shift"),
    key: free === "[plus]" ? "+" : free
  }
}

const modifiersMatch = (hotkey: Hotkey, pressed: Pressed) => {
  if (hotkey.alt !== pressed.altKey) return false
  if (hotkey.shift !== pressed.shiftKey) return false
  if (hotkey.mod) return pressed.ctrlKey || pressed.metaKey
  if (hotkey.ctrl !== pressed.ctrlKey) return false

  return hotkey.meta === pressed.metaKey
}

export const matchesHotkey = (hotkey: string, pressed: Pressed, usePhysicalKeys = false): boolean => {
  const parsed = parseHotkey(hotkey)
  if (parsed.key === undefined) return false
  if (!modifiersMatch(parsed, pressed)) return false

  return normalize(usePhysicalKeys ? pressed.code : pressed.key) === normalize(parsed.key)
}

const field = (value: unknown, name: string): unknown => Reflect.get(Object(value), name)

export const shouldFire = (target: unknown, tagsToIgnore: ReadonlyArray<string>, triggerOnContentEditable: boolean) => {
  if (tagsToIgnore.includes(String(field(target, "tagName")))) return false

  return triggerOnContentEditable || field(target, "isContentEditable") !== true
}

export const pressedOf = (event: unknown): Pressed => ({
  altKey: field(event, "altKey") === true,
  ctrlKey: field(event, "ctrlKey") === true,
  metaKey: field(event, "metaKey") === true,
  shiftKey: field(event, "shiftKey") === true,
  key: String(field(event, "key")),
  code: String(field(event, "code"))
})

export type HotkeysOptions = {
  readonly tagsToIgnore?: ReadonlyArray<string>
  readonly triggerOnContentEditable?: boolean
}

export const defaultTagsToIgnore = ["INPUT", "TEXTAREA", "SELECT"]

const keyListener =
  (
    queue: Queue.Queue<string, Cause.Done>,
    items: ReadonlyArray<HotkeyItem>,
    tagsToIgnore: ReadonlyArray<string>,
    triggerOnContentEditable: boolean
  ) =>
  (event: Event) => {
    if (!shouldFire(event.target, tagsToIgnore, triggerOnContentEditable)) return
    const pressed = pressedOf(event)
    items
      .filter(([hotkey, options]) => matchesHotkey(hotkey, pressed, options?.usePhysicalKeys))
      .forEach(([hotkey, options]) => {
        if (options?.preventDefault !== false) event.preventDefault()
        Queue.offerUnsafe(queue, hotkey)
      })
  }

export const hotkeysOn = (
  target: EventTarget,
  items: ReadonlyArray<HotkeyItem>,
  options: HotkeysOptions = {}
): Stream.Stream<string> =>
  Stream.callback<string>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const listener = keyListener(
          queue,
          items,
          options.tagsToIgnore ?? defaultTagsToIgnore,
          options.triggerOnContentEditable ?? false
        )
        target.addEventListener("keydown", listener)

        return listener
      }),
      (listener) => Effect.sync(() => target.removeEventListener("keydown", listener))
    )
  )
