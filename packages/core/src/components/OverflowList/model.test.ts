import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import {
  countFromEnd,
  countFromStart,
  dataSignature,
  fitsInRows,
  init,
  Message,
  overflowWrapsAtEnd,
  update
} from "./model.ts"
import type { Model } from "./model.ts"

const { given, message, model, story } = Story

const overflowList = (current: Model, sent: Message) => ({ model: update(current, sent) })

const box = (top: number, width = 50) => ({ top, bottom: top + 20, width })

describe("OverflowList measuring, as Mantine's", () => {
  it("fits widths into rows with gaps", () => {
    expect(fitsInRows([40, 40], 84, 4, 1)).toBe(true)
    expect(fitsInRows([40, 40], 83, 4, 1)).toBe(false)
    expect(fitsInRows([40, 40], 83, 4, 2)).toBe(true)
    expect(fitsInRows([40, 40, 40], 50, 4, 2)).toBe(false)
    expect(fitsInRows([40, 40, 40, 40], 50, 4, 2)).toBe(false)
    expect(fitsInRows([200], 50, 4, 1)).toBe(true)
  })

  it("counts the items that fit from the end", () => {
    expect(countFromStart([30, 30, 30, 30], 70, 4, 1, Infinity)).toBe(2)
    expect(countFromStart([30, 30], 100, 4, 1, Infinity)).toBe(2)
    expect(countFromStart([30, 30, 30], 100, 4, 1, 1)).toBe(1)
  })

  it("counts the items on the first rows", () => {
    expect(countFromEnd([box(0), box(0), box(24), box(48)], 200, 1, Infinity)).toBe(2)
    expect(countFromEnd([box(0), box(0), box(24), box(48)], 200, 2, Infinity)).toBe(3)
    expect(countFromEnd([box(0), box(0), box(24)], 200, 2, 2)).toBe(2)
    expect(countFromEnd([box(0, 300)], 200, 1, Infinity)).toBe(0)
    expect(countFromEnd([box(0, 100)], 200, 1, Infinity)).toBe(1)
    expect(countFromEnd([], 200, 1, Infinity)).toBe(0)
  })

  it("sees an indicator that wrapped below the last row", () => {
    expect(overflowWrapsAtEnd([box(0), box(0)], box(0))).toBe(false)
    expect(overflowWrapsAtEnd([box(0), box(0)], box(24))).toBe(true)
    expect(overflowWrapsAtEnd([], box(24))).toBe(false)
  })

  it("signs data by key, value or position", () => {
    expect(dataSignature(["a", "b"], undefined)).toBe("a\u0000b")
    expect(dataSignature([{ id: 7 }, { id: 9 }], undefined)).toBe("0\u00001")
    expect(dataSignature([{ id: 7 }], (item) => item.id)).toBe("7")
    expect(dataSignature([null], undefined)).toBe("null")
  })
})

describe("OverflowList phases", () => {
  it("counts, trims the indicator, settles and remeasures", () =>
    story(
      overflowList,
      given(init()),
      message(Message.Counted({ key: "k", count: 5, width: 300 })),
      model((current) =>
        expect(current).toEqual({ key: "k", phase: "checking", visible: 5, subtract: 0, round: 1, width: 300 })
      ),
      message(Message.Subtracted()),
      model((current) => expect(current.subtract).toBe(1)),
      message(Message.Settled()),
      model((current) => expect(current.phase).toBe("normal")),
      message(Message.Resized()),
      model((current) => expect(current.phase).toBe("measuring"))
    ))
})
