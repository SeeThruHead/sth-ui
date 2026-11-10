import { describe, expect, it } from "@effect/vitest"
import {
  byDistance,
  byIndex,
  clampTo,
  engineOf,
  normalizeIndex,
  released,
  removeOffset,
  settle,
  shortcut,
  slideAt,
  slideOffsets,
  valueAt
} from "./engine.ts"
import type { Layout } from "./engine.ts"

const evenly = (count: number, size: number, view: number, endGap = 0): Layout => ({
  view,
  endGap,
  slides: Array.from({ length: count }, (_, index) => ({ start: index * size, size }))
})

const full = evenly(5, 300, 300)
const thirds = evenly(6, 100, 300)

describe("carousel engine, as embla's", () => {
  it("snaps full-width slides one by one", () => {
    const engine = engineOf(full)
    expect(engine.scrollSnaps).toEqual([0, -300, -600, -900, -1200])
    expect(engine.contentSize).toBe(1500)
    expect(engine.limit).toEqual({ min: -1200, max: 0 })
    expect(engine.slidesBySnap).toEqual([[0], [1], [2], [3], [4]])
    expect(engine.loop).toBe(false)
  })

  it("trims or keeps snaps that cannot scroll", () => {
    expect(engineOf(thirds, { align: "start" }).scrollSnaps).toEqual([0, -100, -200, -300])
    expect(engineOf(thirds, { align: "start" }).slidesBySnap).toEqual([[0], [1], [2], [3, 4, 5]])
    const centered = engineOf(thirds)
    expect(centered.scrollSnaps).toEqual([0, -100, -200, -300])
    expect(centered.slidesBySnap).toEqual([[0, 1], [2], [3], [4, 5]])
    expect(engineOf(thirds, { containScroll: "keepSnaps" }).scrollSnaps).toEqual([0, 0, -100, -200, -300, -300])
    expect(engineOf(thirds, { containScroll: "keepSnaps" }).slidesBySnap).toHaveLength(6)
    expect(engineOf(thirds, { containScroll: false, align: "end" }).scrollSnaps).toEqual([
      200, 100, 0, -100, -200, -300
    ])
    expect(engineOf(evenly(2, 100, 300)).scrollSnaps).toEqual([0])
    expect(engineOf(evenly(2, 100, 300)).slidesBySnap).toEqual([[0, 1]])
  })

  it("groups slides by count or by what fits", () => {
    expect(engineOf(thirds, { align: "start", slidesToScroll: 2 }).slidesBySnap).toEqual([
      [0, 1],
      [2, 3],
      [4, 5]
    ])
    expect(engineOf(thirds, { align: "start", slidesToScroll: "auto" }).scrollSnaps).toEqual([0, -300])
    expect(engineOf(thirds, { align: "start", slidesToScroll: "auto", loop: true }).scrollSnaps).toEqual([0, -300])
    expect(engineOf({ view: 300, endGap: 0, slides: [] }).scrollSnaps).toEqual([0])
  })

  it("counts edge gaps", () => {
    expect(engineOf(evenly(3, 300, 300, 20)).contentSize).toBe(920)
    expect(engineOf(evenly(3, 300, 300, 20), { containScroll: false }).contentSize).toBe(900)
    expect(engineOf({ view: 300, endGap: 0, slides: [{ start: 10, size: 300 }] }).contentSize).toBe(320)
  })

  it("loops when the slides can cover the view", () => {
    const engine = engineOf(thirds, { loop: true, align: "start" })
    expect(engine.loop).toBe(true)
    expect(engine.limit).toEqual({ min: -600, max: 0 })
    expect(engine.loopPoints.length).toBeGreaterThan(0)
    expect(slideOffsets(engine, 6, 0)).toEqual([0, 0, 0, 0, 0, 0])
    expect(slideOffsets(engine, 6, -450)).toEqual([600, 600, 0, 0, 0, 0])
    expect(slideOffsets(engineOf(thirds), 6, -100)).toEqual([0, 0, 0, 0, 0, 0])
    expect(engineOf(evenly(2, 100, 300), { loop: true }).loop).toBe(false)
  })

  it("reads past the end as empty", () => {
    expect(valueAt([], 2)).toBe(0)
    expect(slideAt([], 0)).toEqual({ start: 0, size: 0 })
  })

  it("normalizes indexes and offsets", () => {
    const looped = engineOf(thirds, { loop: true, align: "start" })
    expect(normalizeIndex(looped, -1)).toBe(5)
    expect(normalizeIndex(looped, 6)).toBe(0)
    expect(normalizeIndex(engineOf(full), 9)).toBe(4)
    expect(normalizeIndex(engineOf(full), -2)).toBe(0)
    expect(removeOffset({ min: -600, max: 0 }, -700)).toBe(-100)
    expect(removeOffset({ min: 0, max: 0 }, 5)).toBe(5)
    expect(clampTo({ min: -10, max: 0 }, 4)).toBe(0)
    expect(settle(looped, 100)).toBe(-500)
    expect(settle(engineOf(full), 100)).toBe(0)
  })

  it("takes the shortest way round a loop", () => {
    const looped = engineOf(thirds, { loop: true, align: "start" })
    expect(shortcut(engineOf(full), -500, 0)).toBe(-500)
    expect(shortcut(looped, -500, 0)).toBe(100)
    expect(shortcut(looped, -500, -1)).toBe(-500)
    expect(shortcut(looped, 100, -1)).toBe(-500)
    expect(shortcut(looped, 0, 1)).toBe(600)
    expect(shortcut(looped, 50, 1)).toBe(50)
    expect(byIndex(looped, 5, 0, 0)).toEqual({ index: 5, distance: 100 })
  })

  it("finds the snap nearest to a distance", () => {
    const engine = engineOf(full)
    expect(byDistance(engine, -320, true, 0)).toEqual({ index: 1, distance: -300 })
    expect(byDistance(engine, -320, false, 0)).toEqual({ index: 1, distance: -320 })
    expect(byDistance(engine, 100, true, 0)).toEqual({ index: 0, distance: 100 })
    expect(byDistance(engineOf(thirds, { loop: true, align: "start" }), -650, true, 0)).toEqual({
      index: 0,
      distance: -600
    })
  })

  it("settles a released drag as embla does", () => {
    const engine = engineOf(full)
    const slow = { velocity: 0, pointer: "mouse" } as const
    expect(released(engine, {}, 0, -40, slow)).toEqual({ index: 0, distance: 40 })
    expect(released(engine, {}, 0, -40, { ...slow, velocity: -1 })).toEqual({ index: 1, distance: -260 })
    expect(released(engine, {}, 1, -260, { ...slow, velocity: 1, pointer: "touch" })).toEqual({
      index: 0,
      distance: 260
    })
    expect(released(engine, { dragFree: true }, 0, -40, { ...slow, velocity: -0.2 })).toEqual({
      index: 0,
      distance: -100
    })
    expect(released(engine, { dragFree: "snap" }, 0, -40, { ...slow, velocity: -0.6 })).toEqual({
      index: 1,
      distance: -260
    })
    expect(released(engine, { skipSnaps: true }, 0, -560, { ...slow, velocity: -1 })).toEqual({
      index: 2,
      distance: -40
    })
    expect(released(engine, { skipSnaps: true }, 0, -40, { ...slow, velocity: -1 })).toEqual({
      index: 1,
      distance: -260
    })
  })
})
