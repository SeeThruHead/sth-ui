import { describe, expect, it } from "@effect/vitest"
import {
  adjacentOnly,
  applyConstraints,
  collapse,
  encode,
  encodeWorking,
  expand,
  isFixed,
  isPixelMode,
  keyboard,
  magnitude,
  redistributeEqual,
  redistributeNearest,
  reset,
  resolve,
  resolvePanel,
  toggleCollapse,
  working
} from "./splitter.ts"
import type { Panel, ResolvedPanel, Splitting } from "./splitter.ts"

const percent = { pixel: false, container: 0, rootFont: 16 }

const pixels = { pixel: true, container: 1000, rootFont: 16 }

const panel = (min = 10, extra: Partial<ResolvedPanel> = {}): ResolvedPanel => ({
  defaultSize: 50,
  min,
  max: 100,
  collapsible: false,
  collapseThreshold: min,
  ...extra
})

const rounded = (values: ReadonlyArray<number>) => values.map((value) => Math.round(value * 100) / 100)

const splitting = (panels: ReadonlyArray<Panel>, sizes: Splitting["sizes"], preCollapse = sizes): Splitting => ({
  panels,
  sizes,
  preCollapse
})

describe("sizes and units", () => {
  it("reads numbers, percentages, pixels and rem", () => {
    expect(magnitude(30)).toBe(30)
    expect(magnitude("12.5%")).toBe(12.5)
    expect(isFixed("10px")).toBe(true)
    expect(isFixed("2rem")).toBe(true)
    expect(isFixed("10%")).toBe(false)
    expect(isFixed(undefined)).toBe(false)
    expect(isPixelMode([{ defaultSize: 50 }, { defaultSize: 50, min: "100px" }], [50, 50], [1])).toBe(true)
    expect(isPixelMode([{ defaultSize: 50 }], [50], ["5%"])).toBe(false)
  })

  it("resolves each unit against the container in pixel mode", () => {
    expect(resolve("40%", percent)).toBe(40)
    expect(resolve(25, pixels)).toBe(250)
    expect(resolve("10%", pixels)).toBe(100)
    expect(resolve("120px", pixels)).toBe(120)
    expect(resolve("2rem", pixels)).toBe(32)
  })

  it("shares what fixed panes leave between the flexible ones", () => {
    expect(working([30, "70%"], percent)).toEqual([30, 70])
    expect(working(["200px", 50, 50], pixels)).toEqual([200, 400, 400])
    expect(rounded(working(["800px", "400px", 1], pixels))).toEqual([666.67, 333.33, 0])
    expect(working(["1000px", 0], pixels)).toEqual([1000, 0])
  })

  it("writes a size back in the unit it came in", () => {
    expect(encode(30, 50, percent)).toBe(30)
    expect(encode(30, "50%", percent)).toBe("30%")
    expect(encode(250, 50, pixels)).toBe(25)
    expect(encode(250, "50%", pixels)).toBe("25%")
    expect(encode(160, "5rem", pixels)).toBe("10rem")
    expect(encode(200, "100px", pixels)).toBe("200px")
    expect(encode(200, "100px", pixels, 0.5)).toBe("400px")
  })

  it("keeps sizes that did not move and unscales fixed sizes once they fit", () => {
    expect(encodeWorking([30, 70], [50, 50], ["50%", 50], percent)).toEqual(["30%", 70])
    expect(encodeWorking([50, 50], [50, 50], ["50%", 50], percent)).toEqual(["50%", 50])
    expect(encodeWorking([600, 300], [666, 333], ["800px", "400px"], pixels)).toEqual(["600px", "300px"])
    const overflowing = working(["800px", "400px"], pixels)
    expect(encodeWorking(overflowing, overflowing, ["800px", "400px"], pixels)).toEqual(["800px", "400px"])
  })

  it("resolves a panel's limits, with Mantine's defaults", () => {
    expect(resolvePanel({ defaultSize: 50 }, percent)).toEqual({
      defaultSize: 50,
      min: 0,
      max: 100,
      collapsible: false,
      collapseThreshold: 0
    })
    expect(
      resolvePanel({ defaultSize: "200px", min: "100px", collapsible: true, collapseThreshold: 5 }, pixels)
    ).toEqual({
      defaultSize: 200,
      min: 100,
      max: 1000,
      collapsible: true,
      collapseThreshold: 50
    })
  })
})

describe("moving a handle", () => {
  it("moves only the two neighbours, within their limits", () => {
    const limited = [panel(20, { max: 70 }), panel(20, { max: 70 })]
    expect(adjacentOnly([50, 50], limited, 0, 40)).toEqual([70, 30])
    expect(applyConstraints([50, 50], limited, 0, -10, undefined)).toEqual([40, 60])
  })

  it("collapses a collapsible neighbour dragged under its threshold", () => {
    expect(applyConstraints([50, 50], [panel(20, { collapsible: true }), panel()], 0, -40, undefined)).toEqual([0, 100])
    expect(applyConstraints([50, 50], [panel(), panel(20, { collapsible: true })], 0, 40, undefined)).toEqual([100, 0])
    expect(applyConstraints([50, 50], [panel(20, { collapsible: true }), panel()], 0, -10, undefined)).toEqual([40, 60])
  })

  it("takes from the nearest panes first", () => {
    const three = [panel(), panel(), panel()]
    expect(redistributeNearest([40, 30, 30], three, 0, 30)).toEqual([70, 10, 20])
    expect(redistributeNearest([40, 30, 30], three, 1, -30)).toEqual([30, 10, 60])
    expect(redistributeNearest([40, 30, 30], three, 0, 10)).toEqual([50, 20, 30])
    expect(redistributeNearest([40, 30, 30], three, 0, 0)).toEqual([40, 30, 30])
  })

  it("takes from every pane on that side equally", () => {
    const three = [panel(), panel(), panel()]
    expect(redistributeEqual([40, 30, 15], three, 0, 30)).toEqual([65, 10, 10])
    expect(redistributeEqual([40, 30, 30], three, 0, 10)).toEqual([50, 25, 25])
    expect(redistributeEqual([40, 30, 15], three, 0, 10)).toEqual([50, 25, 10])
    expect(redistributeEqual([40, 30, 30], three, 1, -10)).toEqual([35, 25, 40])
    expect(redistributeEqual([40, 30, 30], three, 0, 0)).toEqual([40, 30, 30])
  })

  it("collapses after sharing, and hands a custom strategy the move", () => {
    expect(
      applyConstraints(
        [40, 30, 30],
        [panel(), panel(10, { collapsible: true, collapseThreshold: 25 }), panel()],
        0,
        10,
        "nearest"
      )
    ).toEqual([70, 0, 30])
    expect(
      applyConstraints(
        [40, 30, 30],
        [panel(10, { collapsible: true, collapseThreshold: 20 }), panel(), panel()],
        0,
        -25,
        "equal"
      )
    ).toEqual([0, 70, 30])
    expect(applyConstraints([40, 30, 30], [panel(), panel(), panel()], 0, 10, "equal")).toEqual([50, 25, 25])
    expect(
      applyConstraints([50, 50], [panel(), panel()], 0, 5, ({ sizes, delta }) => sizes.map((size) => size + delta))
    ).toEqual([55, 55])
  })
})

describe("collapsing, resetting and the keyboard", () => {
  const halves: ReadonlyArray<Panel> = [{ defaultSize: 50, collapsible: true }, { defaultSize: 50 }]

  it("collapses into the neighbour and expands back to the size before", () => {
    const collapsed = collapse(splitting(halves, [50, 50]), percent, 0)
    expect(collapsed).toEqual({ sizes: [0, 100], preCollapse: [50, 50], collapses: [{ panel: 0, collapsed: true }] })
    expect(collapse(splitting(halves, [50, 50]), percent, 1).collapses).toEqual([])
    expect(collapse(splitting(halves, [0, 100]), percent, 0).collapses).toEqual([])
    expect(expand(splitting(halves, [0, 100], [40, 60]), percent, 0).sizes).toEqual([40, 60])
    expect(expand(splitting(halves, [0, 100], [0, 100]), percent, 0).sizes).toEqual([50, 50])
    expect(expand(splitting(halves, [50, 50]), percent, 0).collapses).toEqual([])
    expect(expand(splitting(halves, [0, 100]), percent, 1).collapses).toEqual([])
    expect(
      expand(splitting([halves[0] ?? { defaultSize: 50 }, { defaultSize: 50, min: 100 }], [0, 100]), percent, 0)
        .collapses
    ).toEqual([])
    expect(toggleCollapse(splitting(halves, [50, 50]), percent, 0).sizes).toEqual([0, 100])
    expect(toggleCollapse(splitting(halves, [0, 100], [30, 70]), percent, 0).sizes).toEqual([30, 70])
    expect(
      collapse(splitting([{ defaultSize: 50 }, { defaultSize: 50, collapsible: true }], [50, 50]), percent, 1).sizes
    ).toEqual([100, 0])
  })

  it("resets a handle to the panes' default share", () => {
    expect(reset(splitting(halves, [70, 30]), percent, 0).sizes).toEqual([50, 50])
    expect(reset(splitting([{ defaultSize: 0 }, { defaultSize: 0 }], [70, 30]), percent, 0).sizes).toEqual([50, 50])
    const reopened = reset(splitting(halves, [0, 100]), percent, 0)
    expect(reopened.collapses).toEqual([{ panel: 0, collapsed: false }])
    const closed = reset(splitting([{ defaultSize: 0 }, { defaultSize: 50 }], [50, 50]), percent, 0)
    expect(closed).toEqual({ sizes: [0, 100], preCollapse: [50, 50], collapses: [{ panel: 0, collapsed: true }] })
  })

  it("moves by a step, to the ends, and toggles collapse", () => {
    const limited: ReadonlyArray<Panel> = [{ defaultSize: 50, min: 20, max: 70 }, { defaultSize: 50 }]
    expect(keyboard(splitting(limited, [50, 50]), percent, 0, "decrease", 10).sizes).toEqual([40, 60])
    expect(keyboard(splitting(limited, [50, 50]), percent, 0, "increase", 10).sizes).toEqual([60, 40])
    expect(keyboard(splitting(limited, [50, 50]), percent, 0, "home", 10).sizes).toEqual([20, 80])
    expect(keyboard(splitting(limited, [50, 50]), percent, 0, "end", 10).sizes).toEqual([70, 30])
    expect(keyboard(splitting(limited, [20, 80]), percent, 0, "home", 10).sizes).toEqual([20, 80])
    expect(keyboard(splitting(halves, [50, 50]), percent, 0, "toggle", 10).sizes).toEqual([0, 100])
    expect(keyboard(splitting(halves, [60, 40]), percent, 0, "toggle", 10).sizes).toEqual([0, 100])
    expect(
      keyboard(
        splitting([{ defaultSize: 50 }, { defaultSize: 50, collapsible: true }], [50, 50]),
        percent,
        0,
        "toggle",
        10
      ).sizes
    ).toEqual([100, 0])
    expect(keyboard(splitting(limited, [50, 50]), percent, 0, "toggle", 10).sizes).toEqual([50, 50])
    const shrunk = keyboard(
      splitting([{ defaultSize: 50, min: 20, collapsible: true }, { defaultSize: 50 }], [25, 75]),
      percent,
      0,
      "decrease",
      10
    )
    expect(shrunk).toEqual({ sizes: [0, 100], preCollapse: [25, 75], collapses: [{ panel: 0, collapsed: true }] })
    expect(
      keyboard(splitting([{ defaultSize: "200px" }, { defaultSize: 1 }], ["200px", 1]), pixels, 0, "increase", "50px")
        .sizes
    ).toEqual(["250px", 75])
  })
})
