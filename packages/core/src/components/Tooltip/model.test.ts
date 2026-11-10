import { describe, expect, it } from "@effect/vitest"
import * as FoldkitTooltip from "@foldkit/ui/tooltip"
import { Duration, Effect, Fiber } from "effect"
import { TestClock } from "effect/testing"
import * as FoldkitCommand from "foldkit/command"
import { Story } from "foldkit/test"
import { modelAfter } from "@sth-ui/testing/Story.ts"
import {
  FloatingMessage,
  init,
  initFloating,
  isOpen,
  Message,
  update,
  updateFloating,
  updateGroup,
  WaitBeforeClosing
} from "./model.ts"
import type { FloatingModel, Model } from "./model.ts"

const { Command, expectOutMessage, given, message, model, story } = Story

const got = (inner: FoldkitTooltip.Message) => Message.GotTooltip({ message: inner })

const focused = got(FoldkitTooltip.Message.FocusedTrigger())
const blurred = got(FoldkitTooltip.Message.BlurredTrigger())

const opened = (expected: boolean) => model<Model>((current) => expect(isOpen(current)).toBe(expected))

type GroupMessage = { readonly index: number; readonly message: Message }

const delays = { openDelay: 500, closeDelay: 200 }

const inGroup =
  (index: number) =>
  (inner: Message): GroupMessage => ({ index, message: inner })

const updateBoth = (models: ReadonlyArray<Model>, sent: GroupMessage) => {
  const results = updateGroup(models, sent.index, sent.message, delays)

  return {
    model: results.map((result) => result.model),
    commands: results.flatMap((result, index) =>
      result.commands.map((command) => FoldkitCommand.mapMessage(command, inGroup(index)))
    )
  }
}

const openedBoth = (expected: ReadonlyArray<boolean>) =>
  model<ReadonlyArray<Model>>((current) => expect(current.map(isOpen)).toEqual(expected))

const waiting = (config: { readonly closeDelay?: number; readonly interactive?: boolean }) =>
  modelAfter(update, init({ id: "a", ...config }), [focused, blurred])

const updateFloatingStory = (current: FloatingModel, sent: FloatingMessage) => ({
  model: updateFloating(current, sent)
})

describe("Tooltip's close delay, interactive panel and group, as Mantine's", () => {
  it("closes at once without a close delay", () =>
    story(
      update,
      given(init({ id: "a" })),
      message(focused),
      opened(true),
      message(blurred),
      opened(false),
      expectOutMessage(FoldkitTooltip.OutMessage.Hidden()),
      message(got(FoldkitTooltip.Message.LeftTrigger())),
      model((current) => expect(current.tooltip.isHovered).toBe(false))
    ))

  it("waits for the close delay before closing", () =>
    story(
      update,
      given(init({ id: "a", closeDelay: 300 })),
      message(focused),
      message(blurred),
      opened(true),
      Command.expectExact(WaitBeforeClosing),
      Command.resolve(WaitBeforeClosing, Message.CompletedWaitBeforeClosing({ version: 2 })),
      opened(false)
    ))

  it("stays open when focus returns before the close delay ends", () =>
    story(
      update,
      given(waiting({ closeDelay: 300 })),
      message(focused),
      message(Message.CompletedWaitBeforeClosing({ version: 2 })),
      opened(true)
    ))

  it("stays open when the pointer comes back before the close delay ends", () =>
    story(
      update,
      given(waiting({ closeDelay: 300 })),
      message(got(FoldkitTooltip.Message.EnteredTrigger())),
      Command.resolveAll(),
      message(Message.CompletedWaitBeforeClosing({ version: 2 })),
      opened(true),
      Command.expectNone()
    ))

  it("keeps an interactive tooltip open while the pointer is on the panel", () =>
    story(
      update,
      given(waiting({ interactive: true })),
      message(Message.EnteredPanel()),
      message(Message.CompletedWaitBeforeClosing({ version: 2 })),
      message(Message.CompletedWaitBeforeClosing({ version: 3 })),
      opened(true),
      message(Message.LeftPanel()),
      Command.resolve(WaitBeforeClosing, Message.CompletedWaitBeforeClosing({ version: 4 })),
      opened(true),
      model((current) => expect(current.tooltip.isHovered).toBe(false))
    ))

  it("ignores the panel on a tooltip that is not interactive, and closes on Escape", () =>
    story(
      update,
      given(init({ id: "b" })),
      message(focused),
      message(Message.LeftPanel()),
      opened(true),
      Command.expectNone(),
      message(got(FoldkitTooltip.Message.PressedEscape())),
      expectOutMessage(FoldkitTooltip.OutMessage.Hidden())
    ))

  it("opens the next tooltip of a group at once and closes the last", () =>
    story(
      updateBoth,
      given(modelAfter(updateBoth, [init({ id: "a" }), init({ id: "b" })], [inGroup(0)(focused), inGroup(0)(blurred)])),
      openedBoth([true, false]),
      message(inGroup(1)(got(FoldkitTooltip.Message.EnteredTrigger()))),
      model((current) => expect(current[1]?.tooltip.showDelay).toEqual(Duration.zero)),
      Command.resolve(
        FoldkitTooltip.WaitBeforeShowing,
        FoldkitTooltip.Message.CompletedWaitBeforeShowing({ version: 1 })
      ),
      message(inGroup(1)(focused)),
      openedBoth([false, true])
    ))

  it("opens a tooltip of a group with its own delay when none is open", () =>
    story(
      updateBoth,
      given([init({ id: "c" }), init({ id: "d" })]),
      message(inGroup(0)(focused)),
      openedBoth([true, false])
    ))

  it("waits for its own open delay when no tooltip of the group is open", () =>
    story(
      updateBoth,
      given([init({ id: "c" }), init({ id: "d" })]),
      message(inGroup(0)(got(FoldkitTooltip.Message.EnteredTrigger()))),
      Command.expectExact(FoldkitTooltip.WaitBeforeShowing),
      Command.resolve(
        FoldkitTooltip.WaitBeforeShowing,
        FoldkitTooltip.Message.CompletedWaitBeforeShowing({ version: 1 })
      ),
      openedBoth([true, false])
    ))

  it.effect("finishes the close wait with its version", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(WaitBeforeClosing({ delay: 300, version: 7 }).effect)
      yield* TestClock.adjust(Duration.millis(300))
      const finished = yield* Fiber.join(fiber)
      expect(finished).toEqual(Message.CompletedWaitBeforeClosing({ version: 7 }))
    })
  )

  it("opens Tooltip.Floating while the pointer is on its target", () =>
    story(
      updateFloatingStory,
      given(initFloating({ id: "f" })),
      message(FloatingMessage.Entered()),
      model((current) => expect(current.opened).toBe(true)),
      message(FloatingMessage.Left()),
      model((current) => expect(current.opened).toBe(false))
    ))
})
