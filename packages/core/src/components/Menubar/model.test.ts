import { describe, expect, it } from "@effect/vitest"
import * as FoldkitMenu from "@foldkit/ui/menu"
import { Effect, Option, Schema } from "effect"
import * as FoldkitCommand from "foldkit/command"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { menuClosed, menuOpened } from "../../testing/menu.ts"
import { gotMenu, init, Message, OutMessage, targetId, update } from "./model.ts"
import type { MenubarContext, Model } from "./model.ts"

const { Command, expectOutMessage, given, message, model, story } = Story

const entry = (label: string, disabled = false) => ({ label, first: 0, last: 2, disabled })

const Focus = FoldkitCommand.define("TestFocus", {
  args: { selector: Schema.String },
  messages: [Message.CompletedFocus],
  execute: () => Effect.succeed(Message.CompletedFocus())
})

const focusTarget = (selector: string) => Focus({ selector })

const context: MenubarContext = {
  entries: [entry("File"), entry("Edit"), entry("View", true), entry("Help")],
  focusTarget
}

const twoEntries = { entries: [entry("File"), entry("Edit")], focusTarget }

const fresh = (): Model => init({ id: "bar", count: 4 })

const menubar = (options: MenubarContext = context) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const after = (messages: ReadonlyArray<Message>) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), fresh(), messages)

const key = (index: number, pressed: string) => Message.PressedKey({ index, key: pressed })

const focused = (expected: number) => model<Model>((current) => expect(current.focused).toBe(expected))

const menuOpen = (index: number, expected: boolean) =>
  model<Model>((current) => expect(current.menus[index]?.isOpen).toBe(expected))

const activeItem = (index: number, expected: number) =>
  model<Model>((current) => expect(current.menus[index]?.maybeActiveItemIndex).toEqual(Option.some(expected)))

const focusMoved = Command.resolve(Focus, Message.CompletedFocus())

const moves = (from: number, pressed: string, to: number, options: MenubarContext = context) =>
  story(
    menubar(options),
    given(fresh()),
    message(key(from, pressed)),
    focused(to),
    Command.expectExact(Focus),
    focusMoved
  )

const stays = (from: Model, sent: Message, options: MenubarContext = context) =>
  story(menubar(options), given(from), message(sent), Command.expectNone())

describe("Menubar, as Mantine's", () => {
  it("makes one menu per entry", () => {
    expect(fresh().menus.map((menu) => menu.id)).toEqual(["bar-0", "bar-1", "bar-2", "bar-3"])
    expect(targetId(fresh(), 1)).toBe(FoldkitMenu.buttonId("bar-1"))
    expect(gotMenu(2)(FoldkitMenu.Message.Closed())).toEqual(
      Message.GotMenu({ index: 2, message: FoldkitMenu.Message.Closed() })
    )
  })

  it("moves focus between targets, skipping disabled ones and wrapping", () => {
    moves(1, "ArrowRight", 3)
    moves(3, "ArrowRight", 0)
    moves(0, "ArrowLeft", 3)
    moves(0, "ArrowLeft", 1, { ...context, dir: "rtl" })
    moves(0, "ArrowRight", 3, { ...context, dir: "rtl" })
    moves(1, "Home", 0)
    moves(0, "End", 3)
  })

  it("stops at the ends without loop, and with nothing to focus", () => {
    stays(fresh(), key(3, "ArrowRight"), { ...context, loop: false })
    stays(fresh(), key(0, "End"), { entries: [entry("A", true)], focusTarget })
  })

  it("moves to the next target starting with a typed letter", () => {
    moves(0, "h", 3)
    stays(fresh(), key(0, "v"))
    stays(fresh(), key(0, "Tab"))
  })

  it("opens on the first item", () =>
    story(menubar(), given(fresh()), message(key(1, "ArrowDown")), menuOpen(1, true), activeItem(1, 0), menuOpened()))

  it("opens on the last item", () =>
    story(menubar(), given(fresh()), message(key(0, "ArrowUp")), activeItem(0, 2), menuOpened()))

  it("opens on Enter", () =>
    story(menubar(), given(fresh()), message(key(0, "Enter")), menuOpen(0, true), menuOpened()))

  it("switches the open menu with the arrow keys", () =>
    story(
      menubar(),
      given(after([key(1, "ArrowDown")])),
      message(key(1, "ArrowRight")),
      menuOpen(3, true),
      focused(3),
      menuOpened(),
      menuClosed()
    ))

  it("wraps the open menu to the first, or stops without loop", () => {
    story(
      menubar(twoEntries),
      given(after([key(1, "ArrowDown")])),
      message(key(1, "ArrowRight")),
      menuOpen(0, true),
      menuOpened(),
      menuClosed()
    )
    stays(after([key(1, "ArrowDown")]), key(1, "ArrowRight"), { ...twoEntries, loop: false })
  })

  it("opens on hover only once a menu is open, or always with the hover trigger", () => {
    stays(fresh(), Message.Hovered({ index: 1 }))
    story(
      menubar({ ...context, trigger: "hover" }),
      given(fresh()),
      message(Message.Hovered({ index: 1 })),
      menuOpen(1, true),
      menuOpened()
    )
    story(
      menubar(),
      given(after([key(0, "ArrowDown")])),
      message(Message.Hovered({ index: 1 })),
      menuOpen(1, true),
      menuOpened(),
      menuClosed()
    )
    const opened = after([key(0, "ArrowDown")])
    story(
      menubar(),
      given(opened),
      message(Message.Hovered({ index: 0 })),
      model((current) => expect(current).toEqual(opened))
    )
  })

  it("tracks focus", () => {
    story(menubar(), given(fresh()), message(Message.Focused({ index: 2 })), focused(2))
    stays(fresh(), Message.CompletedFocus())
    stays(fresh(), Message.GotMenu({ index: 0, message: FoldkitMenu.Message.CompletedFocusButton() }))
  })

  it("reports a selected item and closes its menu", () =>
    story(
      menubar(),
      given(after([key(1, "ArrowDown")])),
      message(Message.GotMenu({ index: 1, message: FoldkitMenu.Message.SelectedItem({ index: 0, item: "undo" }) })),
      expectOutMessage([OutMessage.Selected({ menu: 1, value: "undo" })]),
      menuOpen(1, false),
      menuClosed()
    ))
})
