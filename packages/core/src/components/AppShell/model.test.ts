import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  activeSection,
  clampSize,
  currentSizeOf,
  init,
  maxOf,
  Message,
  resetAll,
  resetSize,
  resizeDelta,
  setSize,
  sizeOf,
  update
} from "./model.ts"
import type { Model, OutMessage, Section } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const shell = init({
  id: "shell",
  navbar: { min: 150, max: 400, collapseThreshold: 120 },
  aside: {},
  footer: { label: "Footer size" },
  initialSizes: { aside: 250 }
})

const appShell = listingOutMessages(update)

const after = (...messages: ReadonlyArray<Message>) => modelAfter(update, shell, messages)

const key = (section: Section, name: string, shift = false) =>
  Message.PressedKey({ section, key: name, shift, currentSize: 200, viewport: 900 })

const sizes = (current: Model) =>
  [current.sizes.navbar, current.sizes.aside, current.sizes.header, current.sizes.footer].map(Option.getOrNull)

const press = Message.PressedHandle({ section: "navbar", x: 300, y: 10, startSize: 300, viewport: 1000 })

const tagged =
  (expected: ReadonlyArray<string>) =>
  <S extends { readonly outMessage: ReadonlyArray<OutMessage> | undefined }>(simulation: S): S => {
    expect((simulation.outMessage ?? []).map((out) => out._tag)).toEqual(expected)

    return simulation
  }

const firstOut =
  (expected: OutMessage) =>
  <S extends { readonly outMessage: ReadonlyArray<OutMessage> | undefined }>(simulation: S): S => {
    expect(simulation.outMessage?.[0]).toEqual(expected)

    return simulation
  }

const sized = (section: Section, expected: number | null) =>
  model<Model>((current) => expect(Option.getOrNull(current.sizes[section])).toBe(expected))

const keyed = (pressed: Message, ...steps: ReadonlyArray<Step>) =>
  story(appShell, given(shell), message(pressed), ...steps)

const at = (index: number, expected: number) => model<Model>((current) => expect(sizes(current)[index]).toBe(expected))

const collapsed = (value: boolean) => ({
  _tag: "CollapseChanged" as const,
  section: "navbar" as const,
  collapsed: value
})

describe("AppShell resize, as useAppShellResize", () => {
  it("starts from the initial sizes and measures sections", () => {
    expect(Option.getOrNull(shell.sizes.aside)).toBe(250)
    expect(Option.isNone(shell.sizes.navbar)).toBe(true)
    story(
      appShell,
      given(shell),
      message(Message.MeasuredSection({ section: "navbar", size: 280, width: 1200, height: 800 })),
      model((current) => expect(Option.getOrNull(currentSizeOf(current, "navbar"))).toBe(280)),
      model((current) =>
        expect([maxOf(current, "navbar"), maxOf(current, "aside"), maxOf(current, "header")]).toEqual([400, 1200, 800])
      )
    )
  })

  it("resizes by dragging, clamped to the limits and the viewport", () =>
    story(
      appShell,
      given(shell),
      message(press),
      message(Message.MovedPointer({ x: 350, y: 40 })),
      model((current) => expect(Option.getOrNull(sizeOf(current, "navbar"))).toBe(350)),
      model((current) => expect(Option.getOrNull(activeSection(current))).toBe("navbar")),
      model((current) => expect(Option.isNone(sizeOf(current, "aside"))).toBe(false)),
      message(Message.MovedPointer({ x: 900, y: 0 })),
      tagged(["Resized"]),
      message(Message.ReleasedPointer()),
      tagged(["ResizeEnded"]),
      sized("navbar", 400),
      model((current) => expect(Option.isNone(activeSection(current))).toBe(true))
    ))

  it("reports crossing the collapse threshold once, and puts it back when cancelled", () =>
    story(
      appShell,
      given(after(press)),
      message(Message.MovedPointer({ x: 100, y: 0 })),
      model((current) => expect(Option.getOrNull(sizeOf(current, "navbar"))).toBe(150)),
      message(Message.MovedPointer({ x: 110, y: 0 })),
      tagged(["Resized"]),
      message(Message.CancelledResize()),
      expectOutMessage([collapsed(false)]),
      sized("navbar", null)
    ))

  it("reports collapsing as the drag crosses the threshold", () =>
    story(
      appShell,
      given(after(press)),
      message(Message.MovedPointer({ x: 100, y: 0 })),
      tagged(["Resized", "CollapseChanged"])
    ))

  it("ignores a press without a move, and pointer messages while idle", () => {
    story(
      appShell,
      given(after(press)),
      message(Message.ReleasedPointer()),
      expectNoOutMessage(),
      sized("navbar", null)
    )
    story(
      appShell,
      given(shell),
      message(Message.MovedPointer({ x: 1, y: 1 })),
      expectNoOutMessage(),
      message(Message.ReleasedPointer()),
      expectNoOutMessage(),
      message(Message.CancelledResize()),
      expectNoOutMessage()
    )
  })

  it("resizes with the keyboard", () => {
    keyed(key("navbar", "ArrowRight"), at(0, 210))
    keyed(key("navbar", "ArrowLeft", true), at(0, 150))
    keyed(key("aside", "ArrowLeft"), at(1, 210))
    keyed(key("header", "ArrowDown"), at(2, 210))
    keyed(key("footer", "ArrowDown"), at(3, 190))
    keyed(key("navbar", "Home"), at(0, 150))
    keyed(key("navbar", "End"), at(0, 400))
    keyed(key("aside", "Home"), at(1, 0))
    keyed(key("aside", "End"), at(1, 900))
    keyed(key("navbar", "ArrowUp"), expectNoOutMessage())
    keyed(key("navbar", "a"), expectNoOutMessage())
  })

  it("reports leaving the collapsed size from the keyboard", () =>
    keyed(
      Message.PressedKey({ section: "navbar", key: "Home", shift: false, currentSize: 100, viewport: 900 }),
      tagged(["CollapseChanged", "ResizeEnded"]),
      firstOut(collapsed(false))
    ))

  it("resets a section on double click, and sets sizes", () => {
    keyed(Message.DoubleClickedHandle({ section: "aside" }), sized("aside", null))
    expect(Option.getOrNull(setSize(shell, "header", 70).sizes.header)).toBe(70)
    expect(Option.isNone(resetSize(shell, "aside").sizes.aside)).toBe(true)
    expect(Option.isNone(resetAll(shell).sizes.aside)).toBe(true)
  })

  it("follows the section's side and the direction", () => {
    expect(resizeDelta("navbar", 10, 0, "ltr")).toBe(10)
    expect(resizeDelta("navbar", 10, 0, "rtl")).toBe(-10)
    expect(resizeDelta("aside", 10, 0, "ltr")).toBe(-10)
    expect(resizeDelta("footer", 0, 10, "ltr")).toBe(-10)
    expect(clampSize(50, { min: 500 }, 300)).toBe(300)
    expect(init({ id: "x", dir: "rtl" }).dir).toBe("rtl")
  })
})
