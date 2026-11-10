import { describe, expect, it } from "@effect/vitest"
import {
  autoCloseOf,
  collapsedTransform,
  distribute,
  expandedOffsets,
  grouped,
  positionOf,
  shouldDismiss,
  stackOrder,
  stateTransform,
  swipeOpacity
} from "./queue.ts"

const item = (
  id: string,
  sequence: number,
  extra: { readonly position?: "top-left"; readonly priority?: number } = {}
) => ({
  id,
  sequence,
  ...extra
})

describe("notification queue, as Mantine's notifications store", () => {
  it("shows the first few per position by priority, then order, and queues the rest", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2, { priority: 5 }), item("d", 3, { position: "top-left" })]
    expect(distribute(items, "bottom-right", 2)).toEqual({
      visible: [item("c", 2, { priority: 5 }), item("a", 0), item("d", 3, { position: "top-left" })],
      queued: [item("b", 1)]
    })
    expect(positionOf(item("a", 0), "top-center")).toBe("top-center")
  })

  it("groups by position and stacks newest first", () => {
    const items = [item("a", 0), item("d", 3, { position: "top-left" })]
    expect(grouped(items, "bottom-right")["bottom-right"]).toEqual([item("a", 0)])
    expect(grouped(items, "bottom-right")["top-left"]).toEqual([item("d", 3, { position: "top-left" })])
    expect(grouped(items, "bottom-right")["top-center"]).toEqual([])
    expect(stackOrder([item("a", 0), item("b", 1), item("c", 2, { priority: 1 })]).map((entry) => entry.id)).toEqual([
      "c",
      "b",
      "a"
    ])
  })

  it("resolves auto close as getAutoClose", () => {
    expect(autoCloseOf(4000, 1000)).toBe(1000)
    expect(autoCloseOf(4000, false)).toBe(false)
    expect(autoCloseOf(false, undefined)).toBe(false)
    expect(autoCloseOf(4000, undefined)).toBe(4000)
  })

  it("slides in from the position's side", () => {
    expect(stateTransform("top-left", false)).toBe("translateX(-100%)")
    expect(stateTransform("bottom-right", false)).toBe("translateX(100%)")
    expect(stateTransform("top-center", false)).toBe("translateY(-100%)")
    expect(stateTransform("bottom-center", true)).toBe("translateY(0)")
  })

  it("places stacked notifications", () => {
    expect(expandedOffsets([40, undefined, 30], "top-right")).toEqual([0, 48, 120])
    expect(expandedOffsets([40, 50], "bottom-right")).toEqual([-0, -48])
    expect(collapsedTransform(2, "top-right")).toBe("scale(0.94) translateY(20px)")
    expect(collapsedTransform(9, "bottom-left")).toBe("scale(0.88) translateY(-40px)")
  })

  it("dismisses swipes past a third of the width or fast ones", () => {
    expect(shouldDismiss(160, 0, 440)).toBe(true)
    expect(shouldDismiss(-20, 0.6, 440)).toBe(true)
    expect(shouldDismiss(20, 0.1, 440)).toBe(false)
    expect(swipeOpacity(100, false)).toBe(0.7)
    expect(swipeOpacity(500, false)).toBe(0.4)
    expect(swipeOpacity(0, true)).toBe(0)
  })
})
