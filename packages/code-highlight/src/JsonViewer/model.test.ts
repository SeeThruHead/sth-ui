import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { CopyMessage, CopyText, ExpireCopy } from "../clipboard.ts"
import { serializePath } from "./jsonValue.ts"
import { allTarget, init, Message, OutMessage, setExpandedPaths, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const value = { user: { name: "a", tags: ["x"] }, list: [1, 2] }

const jsonViewer = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const allExpanded = listingOutMessages((current: Model, sent: Message) => update(current, sent, { allExpanded: true }))

const fresh = init({ id: "j", value })

const expanded = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.expanded).toEqual(expected))

const copied = (expected: Option.Option<string>) => model<Model>((current) => expect(current.copied).toEqual(expected))

describe("json viewer state, as Mantine's JsonViewer", () => {
  it("expands to the default depth, or takes the given paths", () => {
    expect(fresh.expanded).toEqual([])
    expect(init({ id: "j", value, defaultExpandDepth: 2 }).expanded).toEqual(["user", "list"])
    expect(
      init({ id: "j", value: { list: [1, 2, 3] }, defaultExpandDepth: 3, groupArraysAfterLength: 2 }).expanded
    ).toEqual(["list", serializePath(["list", "[0...1]"]), serializePath(["list", "[2...2]"])])
    expect(init({ id: "j", value, expandedPaths: ["list"] }).expanded).toEqual(["list"])
    expect(setExpandedPaths(fresh, ["list"]).expanded).toEqual(["list"])
  })

  it("toggles paths and reports them", () =>
    story(
      jsonViewer,
      given(fresh),
      message(Message.Toggled({ path: "user" })),
      expectOutMessage([OutMessage.ExpandedPathsChanged({ paths: ["user"] })]),
      message(Message.Toggled({ path: "user" })),
      expanded([])
    ))

  it("reports nothing while everything is expanded", () =>
    story(allExpanded, given(fresh), message(Message.Toggled({ path: "user" })), expectNoOutMessage()))

  it("expands and collapses everything", () => {
    story(
      jsonViewer,
      given(fresh),
      message(Message.ExpandedAll({ paths: ["user", "list"] })),
      expanded(["user", "list"])
    )
    story(
      jsonViewer,
      given({ ...fresh, expanded: ["user"] }),
      message(Message.CollapsedAll()),
      expectOutMessage([OutMessage.ExpandedPathsChanged({ paths: [] })])
    )
  })

  it("shows more of a long string and reports selections", () => {
    story(
      jsonViewer,
      given(fresh),
      message(Message.ToggledString({ path: "user\u0000name" })),
      model((current) => expect(current.strings).toEqual(["user\u0000name"])),
      message(Message.ToggledString({ path: "user\u0000name" })),
      model((current) => expect(current.strings).toEqual([]))
    )
    story(
      jsonViewer,
      given(fresh),
      message(Message.Selected({ path: ["user", "name"] })),
      expectOutMessage([OutMessage.ValueSelected({ path: ["user", "name"] })])
    )
  })

  it("copies and shows the copied state for a while", () =>
    story(
      jsonViewer,
      given(fresh),
      message(Message.Copied({ target: allTarget, text: "{}", timeout: 2000 })),
      Command.expectExact(CopyText),
      Command.resolve(CopyText, CopyMessage.CopyDone({ target: "user", timeout: 1000 })),
      copied(Option.some("user")),
      Command.expectExact(ExpireCopy({ target: "user", timeout: 1000 })),
      Command.resolve(ExpireCopy, CopyMessage.CopyExpired({ target: "user" })),
      copied(Option.none())
    ))

  it("keeps the copied state when another target expires, and ignores a failure", () => {
    story(
      jsonViewer,
      given({ ...fresh, copied: Option.some("user") }),
      message(Message.CopyExpired({ target: "list" })),
      copied(Option.some("user"))
    )
    story(
      jsonViewer,
      given(fresh),
      message(Message.CopyFailed()),
      model((current) => expect(current).toEqual(fresh)),
      expectNoOutMessage(),
      Command.expectNone()
    )
  })
})
