import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { Story } from "foldkit/test"
import { modelAfter } from "@sth-ui/testing/Story.ts"
import { ClearAfter, HideAfter, init, Message, nextProgress, Tick, update } from "./model.ts"
import type { Model } from "./model.ts"

const { Command, given, message, model, story } = Story

const after = (from: Model, messages: ReadonlyArray<Message>) => modelAfter(update, from, messages)

const progress = (expected: number) => model<Model>((current) => expect(current.progress).toBe(expected))

describe("NavigationProgress, as Mantine's nprogress store", () => {
  it("steps faster at the start and stops at 100", () => {
    expect(nextProgress(0)).toBe(10)
    expect(nextProgress(30)).toBe(34)
    expect(nextProgress(60)).toBe(62)
    expect(nextProgress(90)).toBe(91)
    expect(nextProgress(100)).toBe(100)
    expect(nextProgress(-5)).toBe(-4.5)
  })

  it("starts and ticks on its interval", () =>
    story(
      update,
      given(init({ stepInterval: 200 })),
      message(Message.Started()),
      model((current) => expect(current).toMatchObject({ progress: 10, mounted: true, running: true, generation: 1 })),
      Command.expectExact(Tick),
      Command.resolve(Tick, Message.Ticked({ generation: 1 })),
      progress(20),
      Command.expectExact(Tick),
      Command.resolve(Tick, Message.Ticked({ generation: 0 })),
      progress(20)
    ))

  it("stops, and ignores a tick that was already on its way", () =>
    story(
      update,
      given(after(init({ stepInterval: 200 }), [Message.Started(), Message.Ticked({ generation: 1 })])),
      message(Message.Stopped()),
      model((current) => expect(current.running).toBe(false)),
      message(Message.Ticked({ generation: 1 })),
      model((current) => expect(current).toMatchObject({ running: false, progress: 20 }))
    ))

  it("sets a value within 0 to 100", () => {
    story(
      update,
      given(init()),
      message(Message.Set({ value: 140 })),
      model((current) => expect(current).toMatchObject({ progress: 100, mounted: true }))
    )
    story(update, given(init()), message(Message.Set({ value: -3 })), progress(0))
  })

  it("increments, and hides once it is full", () => {
    story(
      update,
      given(init({ initialProgress: 40 })),
      message(Message.Incremented()),
      model((current) => expect(current).toMatchObject({ progress: 41, mounted: true }))
    )
    story(
      update,
      given(init({ initialProgress: 99.5 })),
      message(Message.Incremented()),
      model((current) => expect(current).toMatchObject({ progress: 100, mounted: false })),
      Command.expectExact(ClearAfter),
      Command.resolve(ClearAfter, Message.Cleared({ generation: 0, full: false })),
      progress(0)
    )
  })

  it("decrements and resets", () => {
    story(update, given(init({ initialProgress: 0.5 })), message(Message.Decremented()), progress(0))
    story(
      update,
      given(init({ initialProgress: 50 })),
      message(Message.Reset()),
      model((current) => expect(current).toMatchObject({ progress: 0, mounted: false }))
    )
  })

  it("completes, hides, then clears", () =>
    story(
      update,
      given(after(init(), [Message.Started()])),
      message(Message.Completed()),
      model((current) => expect(current).toMatchObject({ progress: 100, running: false, generation: 2 })),
      Command.expectExact(HideAfter, ClearAfter),
      Command.resolve(HideAfter, Message.Hid({ generation: 1 })),
      model((current) => expect(current.mounted).toBe(true)),
      Command.resolve(ClearAfter, Message.Cleared({ generation: 2, full: true })),
      model((current) => expect(current).toMatchObject({ generation: 3, progress: 0 }))
    ))

  it("hides and clears unless something newer happened", () => {
    const completed = after(init(), [Message.Started(), Message.Completed()])
    story(
      update,
      given(completed),
      message(Message.Hid({ generation: 2 })),
      model((current) => expect(current.mounted).toBe(false))
    )
    const hidden = after(completed, [Message.Hid({ generation: 2 })])
    story(update, given(hidden), message(Message.Cleared({ generation: 2, full: false })), progress(0))
    story(
      update,
      given(hidden),
      message(Message.Cleared({ generation: 1, full: true })),
      model((current) => expect(current).toEqual(hidden))
    )
  })

  it.effect("schedules its timers", () =>
    Effect.gen(function* () {
      const tick = yield* Tick({ generation: 4, delay: 0 }).effect
      const hide = yield* HideAfter({ generation: 4, delay: 0 }).effect
      const clear = yield* ClearAfter({ generation: 4, delay: 0, full: true }).effect
      expect(tick).toEqual(Message.Ticked({ generation: 4 }))
      expect(hide).toEqual(Message.Hid({ generation: 4 }))
      expect(clear).toEqual(Message.Cleared({ generation: 4, full: true }))
    })
  )
})
