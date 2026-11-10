import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { Story } from "foldkit/test"
import { modelAfter } from "@sth-ui/testing/Story.ts"
import { init, Message, ResetAfter, update, WriteClipboard } from "./model.ts"
import type { CopyButtonContext, Model } from "./model.ts"

const { Command, given, message, model, story } = Story

const copyButton =
  (context: CopyButtonContext = {}) =>
  (current: Model, sent: Message) =>
    update(current, sent, context)

const withDefaults = (current: Model, sent: Message) => update(current, sent)

const copied = (expected: boolean) => model<Model>((current) => expect(current.copied).toBe(expected))

const pressed = modelAfter(withDefaults, init(), [Message.Pressed({ value: "https://mantine.dev" })])

describe("CopyButton model", () => {
  it("copies, shows copied until the timeout, then resets", () =>
    story(
      copyButton({ timeout: 2000 }),
      given(init()),
      message(Message.Pressed({ value: "https://mantine.dev" })),
      model((current) => expect(current.generation).toBe(1)),
      Command.expectExact(WriteClipboard({ value: "https://mantine.dev", generation: 1 })),
      Command.resolve(WriteClipboard, Message.Copied({ generation: 1 })),
      copied(true),
      Command.expectExact(ResetAfter({ generation: 1, timeout: 2000 })),
      Command.resolve(ResetAfter, Message.TimedOut({ generation: 1 })),
      copied(false)
    ))

  it("ignores results from an older press", () => {
    story(
      withDefaults,
      given(pressed),
      message(Message.Copied({ generation: 0 })),
      model((current) => expect(current).toEqual(pressed))
    )
    const shown = modelAfter(withDefaults, pressed, [Message.Copied({ generation: 1 })])
    story(withDefaults, given(shown), message(Message.TimedOut({ generation: 0 })), copied(true))
  })

  it("shows nothing copied when the clipboard refuses", () =>
    story(withDefaults, given(pressed), message(Message.Failed()), copied(false)))

  it("waits the default timeout", () =>
    story(
      withDefaults,
      given(pressed),
      message(Message.Copied({ generation: 1 })),
      Command.expectExact(ResetAfter),
      Command.resolve(ResetAfter, Message.TimedOut({ generation: 1 }))
    ))

  it.effect("reports a clipboard that can't be written and times out", () =>
    Effect.gen(function* () {
      const written = yield* WriteClipboard({ value: "x", generation: 1 }).effect
      const reset = yield* ResetAfter({ generation: 3, timeout: 0 }).effect
      expect(written).toEqual(Message.Failed())
      expect(reset).toEqual(Message.TimedOut({ generation: 3 }))
    })
  )
})
