import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { modelAfter } from "@sth-ui/testing/Story.ts"
import { ScrollMessage, ScrollTo } from "./commands.ts"
import { activeIndex, init, Message, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, given, message, model, story } = Story

const toc = (current: Model, sent: Message) => update(current, sent)

const fresh = init({ id: "toc" })

const headings = [{ depth: 1, value: "Intro", id: "intro" }]

const scanned = modelAfter(toc, fresh, [Message.Scanned({ headings, active: 0 })])

const unchanged = (from: Model, sent: Message) =>
  story(
    toc,
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    Command.expectNone()
  )

describe("TableOfContents", () => {
  it("picks the heading closest to the offset, the last of equals", () => {
    expect(activeIndex([])).toBe(-1)
    expect(activeIndex([-300, -20, 400])).toBe(1)
    expect(activeIndex([-300, 20, 400], 100)).toBe(1)
    expect(activeIndex([10, 10])).toBe(1)
    expect(activeIndex([500])).toBe(0)
  })

  it("keeps the scanned headings and follows the active one", () => {
    expect(scanned).toMatchObject({ headings, active: 0, initialized: true })
    unchanged(scanned, Message.Scrolled({ active: 0 }))
    story(
      toc,
      given(scanned),
      message(Message.Scrolled({ active: -1 })),
      model((current) => expect(current.active).toBe(-1))
    )
  })

  it("scrolls to a heading with the default or a given selector", () => {
    story(
      toc,
      given(fresh),
      message(Message.ScrolledTo({ index: 2 })),
      Command.expectExact(ScrollTo({ selector: "h1, h2, h3, h4, h5, h6", index: 2 })),
      Command.resolve(ScrollTo, ScrollMessage.Scrolled())
    )
    story(
      (current: Model, sent: Message) => update(current, sent, { selector: "h2" }),
      given(fresh),
      message(Message.ScrolledTo({ index: 0 })),
      Command.expectExact(ScrollTo({ selector: "h2", index: 0 })),
      Command.resolve(ScrollTo, ScrollMessage.Scrolled())
    )
  })

  it("scans again when reinitialized, and ignores a finished scroll", () => {
    story(
      toc,
      given(fresh),
      message(Message.Reinitialized()),
      model((current) => expect(current.generation).toBe(1))
    )
    unchanged(fresh, Message.CompletedScroll())
  })
})
