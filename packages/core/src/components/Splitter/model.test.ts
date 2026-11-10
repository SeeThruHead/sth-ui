import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import {
  collapse,
  expand,
  init,
  isDragging,
  Message,
  OutMessage,
  reset,
  setSizes,
  toggleCollapse,
  update,
  updateWith
} from "./model.ts"
import type { InitConfig, Model } from "./model.ts"

const wide = { width: 600, height: 200, rootFont: 16 }

const tall = { width: 200, height: 400, rootFont: 16 }

const unmeasured = { width: 0, height: 0, rootFont: 16 }

const halves = (config: Partial<InitConfig> = {}): Model =>
  init({ id: "halves", panels: [{ defaultSize: 50 }, { defaultSize: 50, collapsible: true }], ...config })

const sidebar = (): Model =>
  init({
    id: "sidebar",
    step: "20px",
    panels: [{ defaultSize: "200px", min: "120px", max: "400px" }, { defaultSize: 1 }]
  })

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const splitter = listingOutMessages(update)

const evenSplitter = listingOutMessages(
  updateWith({ redistribute: ({ sizes: panelSizes }) => panelSizes.map(() => 100 / panelSizes.length) })
)

const press = (from: Model, x: number, container = wide): Model =>
  modelAfter(update, from, [Message.PressedHandle({ handle: 0, x, y: x, container })])

const sizes = (expected: ReadonlyArray<number | string>) =>
  model<Model>((current) => expect(current.sizes).toEqual(expected))

const dragging = (expected: boolean) => model<Model>((current) => expect(isDragging(current)).toBe(expected))

const unchanged = (from: Model, sent: Message) =>
  story(
    splitter,
    given(from),
    message(sent),
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage()
  )

const key = (move: "increase" | "decrease" | "home", shift = false, container = wide) =>
  Message.PressedKey({ handle: 0, move, shift, container })

describe("Splitter model", () => {
  it("starts from each panel's default size, horizontal and left to right", () => {
    const started = halves()

    expect(started.sizes).toEqual([50, 50])
    expect(started.orientation).toBe("horizontal")
    expect(started.dir).toBe("ltr")
    expect(started.step).toBe(1)
    expect(started.shiftStep).toBe(10)
    expect(started.resetOnDoubleClick).toBe(true)
    expect(isDragging(started)).toBe(false)
  })

  it("takes sizes and steps given at the start", () => {
    const preset = halves({ sizes: [30, 70], shiftStep: 5, resetOnDoubleClick: false })

    expect(preset.sizes).toEqual([30, 70])
    expect(preset.preCollapse).toEqual([30, 70])
    expect(preset.shiftStep).toBe(5)
    expect(preset.resetOnDoubleClick).toBe(false)
  })

  it("takes the container's size from every measurement", () =>
    story(
      splitter,
      given(halves()),
      message(Message.MeasuredContainer({ container: wide })),
      model((current) => expect([current.width, current.height, current.rootFont]).toEqual([600, 200, 16]))
    ))

  it("measures on the press, so a drag before the first measurement still works", () =>
    story(
      splitter,
      given(halves()),
      message(Message.PressedHandle({ handle: 0, x: 100, y: 0, container: wide })),
      expectOutMessage([OutMessage.StartedResize({ handle: 0 })]),
      model((current) => expect(current.width).toBe(600)),
      dragging(true),
      message(Message.MovedPointer({ x: 160, y: 0 })),
      sizes([60, 40]),
      expectOutMessage([OutMessage.ChangedSizes({ sizes: [60, 40] })])
    ))

  it("moves against the pointer in right to left layouts", () =>
    story(
      splitter,
      given(press(halves({ dir: "rtl" }), 100)),
      message(Message.MovedPointer({ x: 40, y: 0 })),
      sizes([60, 40])
    ))

  it("follows the pointer's vertical position in a vertical splitter", () =>
    story(
      splitter,
      given(halves({ orientation: "vertical", dir: "rtl" })),
      message(Message.PressedHandle({ handle: 0, x: 0, y: 100, container: tall })),
      message(Message.MovedPointer({ x: 999, y: 140 })),
      sizes([60, 40])
    ))

  it("ignores pointer moves and releases when nothing is being dragged", () => {
    unchanged(halves(), Message.MovedPointer({ x: 10, y: 10 }))
    unchanged(halves(), Message.ReleasedPointer({ x: 10, y: 10 }))
    unchanged(halves(), Message.ReleasedHandle())
  })

  it("drags a pixel splitter by pixels", () =>
    story(
      splitter,
      given(press(sidebar(), 300)),
      message(Message.MovedPointer({ x: 340, y: 0 })),
      model((current) => expect(current.sizes[0]).toBe("240px"))
    ))

  it("ignores moves while the container has no size", () =>
    unchanged(press(halves(), 0, unmeasured), Message.MovedPointer({ x: 10, y: 10 })))

  it("ends a drag where the pointer is released", () =>
    story(
      splitter,
      given(press(halves(), 100)),
      message(Message.ReleasedPointer({ x: 130, y: 0 })),
      dragging(false),
      sizes([55, 45]),
      expectOutMessage([
        OutMessage.ChangedSizes({ sizes: [55, 45] }),
        OutMessage.EndedResize({ handle: 0, sizes: [55, 45] })
      ])
    ))

  it("ends a quick press and release on the handle without moving", () =>
    story(
      splitter,
      given(press(halves(), 0)),
      message(Message.ReleasedHandle()),
      dragging(false),
      expectOutMessage([OutMessage.EndedResize({ handle: 0, sizes: [50, 50] })])
    ))

  it("steps by the step, or the shift step with Shift held", () => {
    story(splitter, given(halves()), message(key("increase")), sizes([51, 49]))
    story(splitter, given(halves()), message(key("decrease", true)), sizes([40, 60]))
  })

  it("steps a pixel splitter with the size measured on the key press", () =>
    story(
      splitter,
      given(sidebar()),
      message(key("increase")),
      model((current) => expect(current.sizes[0]).toBe("220px"))
    ))

  it("leaves a pixel splitter alone while its container has no size", () =>
    story(splitter, given(sidebar()), message(key("increase", false, unmeasured)), sizes(sidebar().sizes)))

  it("resets a handle on double click unless turned off", () => {
    const moved = setSizes(halves(), [70, 30])
    story(splitter, given(moved), message(Message.DoubleClickedHandle({ handle: 0 })), sizes([50, 50]))
    story(
      splitter,
      given({ ...moved, resetOnDoubleClick: false }),
      message(Message.DoubleClickedHandle({ handle: 0 })),
      sizes([70, 30])
    )
  })

  it("redistributes with the model's choice or the caller's function", () => {
    const three = init({
      id: "three",
      redistribute: "equal",
      panels: [{ defaultSize: 40, min: 30 }, { defaultSize: 30, min: 25 }, { defaultSize: 30 }]
    })
    story(
      splitter,
      given(three),
      message(key("home")),
      model((current) => expect(current.sizes).not.toEqual(three.sizes))
    )
    story(evenSplitter, given(halves()), message(key("increase")), sizes([50, 50]))
  })

  it("collapses, expands, toggles and resets a panel", () => {
    const collapsed = collapse(halves(), 1)

    expect(collapsed.model.sizes).toEqual([100, 0])
    expect(collapsed.outMessages).toContainEqual(OutMessage.ChangedCollapse({ panel: 1, collapsed: true }))
    expect(expand(collapsed.model, 1).model.sizes).toEqual([50, 50])
    expect(toggleCollapse(halves(), 1).model.sizes).toEqual([100, 0])
    expect(reset(setSizes(halves(), [80, 20]), 0).model.sizes).toEqual([50, 50])
  })

  it("reports no change of sizes when a panel that can't collapse is asked to", () => {
    const result = collapse(halves(), 0)

    expect(result.outMessages).toEqual([])
  })
})
