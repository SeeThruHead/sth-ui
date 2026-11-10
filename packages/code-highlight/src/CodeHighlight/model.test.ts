import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { CopyMessage, CopyText, ExpireCopy } from "../clipboard.ts"
import { init, Message, OutMessage, setActiveTab, setExpanded, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, expectOutMessage, given, message, model, story } = Story

const codeHighlight = listingOutMessages(update)

const copied = (expected: Option.Option<string>) => model<Model>((current) => expect(current.copied).toEqual(expected))

describe("code highlight state, as Mantine's CodeHighlight", () => {
  it("starts expanded unless told otherwise", () => {
    expect(init({ id: "c" }).expanded).toBe(true)
    expect(init({ id: "c", expanded: false }).expanded).toBe(false)
    expect(setExpanded(init({ id: "c" }), false).expanded).toBe(false)
  })

  it("toggles the code, reporting the change", () =>
    story(
      codeHighlight,
      given(init({ id: "c", expanded: false })),
      message(Message.ToggledExpanded()),
      model((current) => expect(current).toEqual({ ...init({ id: "c", expanded: false }), expanded: true })),
      expectOutMessage([OutMessage.ExpandedChanged({ expanded: true })]),
      Command.expectNone()
    ))

  it("shows the code", () =>
    story(
      codeHighlight,
      given(init({ id: "c", expanded: false })),
      message(Message.ShowedCode()),
      model((current) => expect(current.expanded).toBe(true))
    ))

  it("copies and shows the copied state for a while", () =>
    story(
      codeHighlight,
      given(init({ id: "c" })),
      message(Message.Copied({ target: "code", text: "x", timeout: 2000 })),
      Command.expectExact(CopyText({ target: "code", text: "x", timeout: 2000 })),
      Command.resolve(CopyText, CopyMessage.CopyDone({ target: "code", timeout: 2000 })),
      copied(Option.some("code")),
      Command.expectExact(ExpireCopy({ target: "code", timeout: 2000 })),
      Command.resolve(ExpireCopy, CopyMessage.CopyExpired({ target: "code" })),
      copied(Option.none())
    ))

  it("keeps the copied state when another target expires, and ignores a failed copy", () => {
    story(
      codeHighlight,
      given({ ...init({ id: "c" }), copied: Option.some("code") }),
      message(Message.CopyExpired({ target: "other" })),
      copied(Option.some("code"))
    )
    story(
      codeHighlight,
      given(init({ id: "c" })),
      message(Message.CopyFailed()),
      model((current) => expect(current).toEqual(init({ id: "c" })))
    )
  })

  it("switches tabs and reports them", () => {
    const second = init({ id: "c", activeTab: 1 })
    expect(second.activeTab).toBe(1)
    expect(init({ id: "c" }).activeTab).toBe(0)
    story(
      codeHighlight,
      given(second),
      message(Message.ChoseTab({ index: 2 })),
      model((current) => expect(current).toEqual({ ...second, activeTab: 2 })),
      expectOutMessage([OutMessage.TabChanged({ index: 2 })]),
      Command.expectNone()
    )
    expect(setActiveTab(second, 0).activeTab).toBe(0)
  })
})
